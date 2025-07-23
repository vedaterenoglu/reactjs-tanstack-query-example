/**
 * Prefetch Queue Management - Command Pattern + Priority Queue
 *
 * Design Patterns Applied:
 * 1. **Command Pattern**: Each prefetch request is an executable command with undo capability
 * 2. **Priority Queue Pattern**: Requests ordered by priority (high, normal, low)
 * 3. **Observer Pattern**: Queue state notifications for React components
 * 4. **Strategy Pattern**: Different execution strategies based on network conditions
 *
 * SOLID Principles:
 * - **SRP**: Only responsible for queue management and command execution
 * - **OCP**: New command types can be added without modifying queue processor
 * - **LSP**: All commands implement consistent Command interface
 * - **ISP**: Separate interfaces for command, queue operations, and processing
 * - **DIP**: Depends on command abstractions, not concrete implementations
 *
 * React 19 Patterns:
 * - Async command execution with proper error handling
 * - Cleanup patterns for queue management
 * - Observer pattern integration for React state updates
 */

import {
  AbortControllerUtils,
  generateRequestId,
} from './abortControllerFactory'

import type { ManagedAbortController } from './abortControllerFactory'

export type PrefetchPriority = 'high' | 'normal' | 'low'
export type PrefetchStrategy = 'immediate' | 'delayed' | 'network-aware'

/**
 * Command Interface - Command Pattern
 * Each prefetch operation implements this interface
 */
export interface PrefetchCommand {
  readonly id: string
  readonly page: number
  readonly priority: PrefetchPriority
  readonly strategy: PrefetchStrategy
  readonly createdAt: number
  readonly abortController: ManagedAbortController

  execute(): Promise<void>
  canExecute(): boolean
  getEstimatedDuration(): number
}

/**
 * Queue State Observer Interface - Observer Pattern
 */
export interface QueueObserver {
  onQueueChange(queueLength: number, activeCount: number): void
  onCommandStart(command: PrefetchCommand): void
  onCommandComplete(command: PrefetchCommand, success: boolean): void
  onCommandError(command: PrefetchCommand, error: Error): void
}

/**
 * Priority Queue Interface - Interface Segregation Principle
 */
export interface PrefetchQueue {
  enqueue(command: PrefetchCommand): boolean
  dequeue(): PrefetchCommand | null
  peek(): PrefetchCommand | null
  size(): number
  isEmpty(): boolean
  clear(): void
  getByPage(page: number): PrefetchCommand[]
  removeByPage(page: number): number
}

/**
 * Queue Processor Interface - Interface Segregation Principle
 */
export interface QueueProcessor {
  start(): void
  stop(): void
  pause(): void
  resume(): void
  isRunning(): boolean
  getStats(): ProcessorStats
  addObserver(observer: QueueObserver): void
  removeObserver(observer: QueueObserver): void
}

export interface ProcessorStats {
  queueLength: number
  activeCommands: number
  completedCommands: number
  failedCommands: number
  maxConcurrent: number
  isRunning: boolean
  isPaused: boolean
}

/**
 * Priority Queue Implementation
 * Commands are ordered by priority, then by creation time
 */
class PriorityPrefetchQueue implements PrefetchQueue {
  private readonly commands: PrefetchCommand[] = []
  private readonly priorityOrder: Record<PrefetchPriority, number> = {
    high: 0,
    normal: 1,
    low: 2,
  }

  enqueue(command: PrefetchCommand): boolean {
    // Prevent duplicate requests for same page
    if (this.getByPage(command.page).length > 0) {
      return false
    }

    // Insert in priority order
    const insertIndex = this.findInsertPosition(command)
    this.commands.splice(insertIndex, 0, command)
    return true
  }

  dequeue(): PrefetchCommand | null {
    return this.commands.shift() || null
  }

  peek(): PrefetchCommand | null {
    return this.commands[0] || null
  }

  size(): number {
    return this.commands.length
  }

  isEmpty(): boolean {
    return this.commands.length === 0
  }

  clear(): void {
    // Abort all queued commands
    for (const command of this.commands) {
      if (!command.abortController.isAborted()) {
        command.abortController.abort('queue-cleared')
      }
    }
    this.commands.length = 0
  }

  getByPage(page: number): PrefetchCommand[] {
    return this.commands.filter(cmd => cmd.page === page)
  }

  removeByPage(page: number): number {
    const initialLength = this.commands.length

    for (let i = this.commands.length - 1; i >= 0; i--) {
      // eslint-disable-next-line security/detect-object-injection
      const command = this.commands[i]
      if (command && command.page === page) {
        if (!command.abortController.isAborted()) {
          command.abortController.abort('removed-from-queue')
        }
        this.commands.splice(i, 1)
      }
    }

    return initialLength - this.commands.length
  }

  private findInsertPosition(command: PrefetchCommand): number {
    const commandPriorityValue = (this.priorityOrder as Record<string, number>)[
      command.priority
    ]

    if (commandPriorityValue === undefined) {
      return this.commands.length
    }

    for (let i = 0; i < this.commands.length; i++) {
      // eslint-disable-next-line security/detect-object-injection
      const existingCommand = this.commands[i]
      if (!existingCommand) continue

      const existingPriorityValue = (
        this.priorityOrder as Record<string, number>
      )[existingCommand.priority] as number

      // Higher priority (lower number) goes first
      if (commandPriorityValue < existingPriorityValue) {
        return i
      }

      // Same priority - sort by creation time (FIFO)
      if (
        commandPriorityValue === existingPriorityValue &&
        command.createdAt < existingCommand.createdAt
      ) {
        return i
      }
    }

    return this.commands.length
  }
}

/**
 * Queue Processor Implementation - Command Pattern Executor
 */
class PrefetchQueueProcessor implements QueueProcessor {
  private readonly queue: PrefetchQueue
  private readonly observers = new Set<QueueObserver>()
  private readonly activeCommands = new Map<string, PrefetchCommand>()

  private isRunningState = false
  private isPausedState = false
  private processingInterval: NodeJS.Timeout | null = null
  private stats: ProcessorStats

  private readonly maxConcurrentRequests: number
  private readonly processingIntervalMs: number

  constructor(queue: PrefetchQueue, maxConcurrent = 2, intervalMs = 100) {
    this.queue = queue
    this.maxConcurrentRequests = maxConcurrent
    this.processingIntervalMs = intervalMs
    this.stats = this.initializeStats()
  }

  start(): void {
    if (this.isRunningState) {
      return
    }

    this.isRunningState = true
    this.isPausedState = false
    this.stats.isRunning = true
    this.stats.isPaused = false

    this.processingInterval = setInterval(() => {
      void this.processQueue()
    }, this.processingIntervalMs)
  }

  stop(): void {
    this.isRunningState = false
    this.isPausedState = false
    this.stats.isRunning = false
    this.stats.isPaused = false

    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }

    // Abort all active commands
    for (const command of this.activeCommands.values()) {
      if (!command.abortController.isAborted()) {
        command.abortController.abort('processor-stopped')
      }
    }
    this.activeCommands.clear()
  }

  pause(): void {
    this.isPausedState = true
    this.stats.isPaused = true
  }

  resume(): void {
    this.isPausedState = false
    this.stats.isPaused = false
  }

  isRunning(): boolean {
    return this.isRunningState
  }

  getStats(): ProcessorStats {
    return {
      ...this.stats,
      queueLength: this.queue.size(),
      activeCommands: this.activeCommands.size,
    }
  }

  addObserver(observer: QueueObserver): void {
    this.observers.add(observer)
  }

  removeObserver(observer: QueueObserver): void {
    this.observers.delete(observer)
  }

  private async processQueue(): Promise<void> {
    if (this.isPausedState || !this.isRunningState) {
      return
    }

    // Process commands while under concurrency limit
    while (
      this.activeCommands.size < this.maxConcurrentRequests &&
      !this.queue.isEmpty()
    ) {
      const command = this.queue.dequeue()
      if (!command || !command.canExecute()) {
        continue
      }

      void this.executeCommand(command)
    }

    // Notify observers of queue changes
    this.notifyQueueChange()
  }

  private async executeCommand(command: PrefetchCommand): Promise<void> {
    this.activeCommands.set(command.id, command)
    this.notifyCommandStart(command)

    try {
      await command.execute()
      this.stats.completedCommands++
      this.notifyCommandComplete(command, true)
    } catch (error) {
      this.stats.failedCommands++
      const commandError =
        error instanceof Error ? error : new Error(String(error))
      this.notifyCommandError(command, commandError)
      this.notifyCommandComplete(command, false)
    } finally {
      this.activeCommands.delete(command.id)
    }
  }

  private notifyQueueChange(): void {
    for (const observer of this.observers) {
      try {
        observer.onQueueChange(this.queue.size(), this.activeCommands.size)
      } catch (error) {
        console.error('Queue observer error:', error)
      }
    }
  }

  private notifyCommandStart(command: PrefetchCommand): void {
    for (const observer of this.observers) {
      try {
        observer.onCommandStart(command)
      } catch (error) {
        console.error('Queue observer error:', error)
      }
    }
  }

  private notifyCommandComplete(
    command: PrefetchCommand,
    success: boolean
  ): void {
    for (const observer of this.observers) {
      try {
        observer.onCommandComplete(command, success)
      } catch (error) {
        console.error('Queue observer error:', error)
      }
    }
  }

  private notifyCommandError(command: PrefetchCommand, error: Error): void {
    for (const observer of this.observers) {
      try {
        observer.onCommandError(command, error)
      } catch (error) {
        console.error('Queue observer error:', error)
      }
    }
  }

  private initializeStats(): ProcessorStats {
    return {
      queueLength: 0,
      activeCommands: 0,
      completedCommands: 0,
      failedCommands: 0,
      maxConcurrent: this.maxConcurrentRequests,
      isRunning: false,
      isPaused: false,
    }
  }
}

/**
 * Prefetch Queue Manager - Facade Pattern
 * Simplified interface for queue operations
 */
class PrefetchQueueManager {
  private static instance: PrefetchQueueManager
  private readonly queue: PrefetchQueue
  private readonly processor: QueueProcessor

  private constructor() {
    this.queue = new PriorityPrefetchQueue()
    this.processor = new PrefetchQueueProcessor(this.queue)
  }

  public static getInstance(): PrefetchQueueManager {
    if (!PrefetchQueueManager.instance) {
      PrefetchQueueManager.instance = new PrefetchQueueManager()
    }
    return PrefetchQueueManager.instance
  }

  /**
   * Add prefetch command to queue
   */
  addPrefetchCommand(command: PrefetchCommand): boolean {
    return this.queue.enqueue(command)
  }

  /**
   * Remove all commands for specific page
   */
  cancelPage(page: number): number {
    return this.queue.removeByPage(page)
  }

  /**
   * Clear entire queue
   */
  clearQueue(): void {
    this.queue.clear()
  }

  /**
   * Start queue processing
   */
  start(): void {
    this.processor.start()
  }

  /**
   * Stop queue processing
   */
  stop(): void {
    this.processor.stop()
  }

  /**
   * Pause/resume processing
   */
  pause(): void {
    this.processor.pause()
  }

  resume(): void {
    this.processor.resume()
  }

  /**
   * Get queue statistics
   */
  getStats(): ProcessorStats {
    return this.processor.getStats()
  }

  /**
   * Add observer for queue events
   */
  addObserver(observer: QueueObserver): void {
    this.processor.addObserver(observer)
  }

  /**
   * Remove observer
   */
  removeObserver(observer: QueueObserver): void {
    this.processor.removeObserver(observer)
  }
}

/**
 * Singleton instance export
 */
export const prefetchQueueManager = PrefetchQueueManager.getInstance()

/**
 * Utility function to create prefetch command
 * Factory function following React 19 patterns
 */
export function createPrefetchCommand(
  page: number,
  priority: PrefetchPriority = 'normal',
  strategy: PrefetchStrategy = 'immediate',
  executor: () => Promise<void>
): PrefetchCommand {
  const requestId = generateRequestId(page)
  const abortController = AbortControllerUtils.createForPrefetch(
    page,
    requestId
  )

  return {
    id: requestId,
    page,
    priority,
    strategy,
    createdAt: Date.now(),
    abortController,

    async execute(): Promise<void> {
      if (this.abortController.isAborted()) {
        throw new Error('Command was aborted before execution')
      }

      await executor()
    },

    canExecute(): boolean {
      return !this.abortController.isAborted()
    },

    getEstimatedDuration(): number {
      // Simple estimation - could be enhanced with historical data
      return strategy === 'delayed' ? 2000 : 1000
    },
  }
}
