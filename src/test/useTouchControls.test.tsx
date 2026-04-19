import { act, fireEvent, render } from '@testing-library/react'
import { useRef } from 'react'
import { Provider } from 'react-redux'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAppStore } from '../app/store'
import { selectActiveTile, selectLockedTiles } from '../features/game/selectors'
import { hardDropActiveTile, restartGame } from '../features/game/thunks'
import { useTouchControls } from '../hooks/useTouchControls'

const TouchHarness = () => {
  const boardRef = useRef<HTMLDivElement | null>(null)
  useTouchControls(boardRef)

  return <div ref={boardRef} data-testid="board" />
}

const mockBoardRect = (element: HTMLElement) => {
  Object.defineProperty(element, 'getBoundingClientRect', {
    value: () => ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      width: 440,
      height: 880,
      right: 440,
      bottom: 880,
      toJSON: () => null,
    }),
  })
}

afterEach(() => {
  vi.useRealTimers()
})

describe('useTouchControls', () => {
  it('moves the active tile to the tapped column after the double-tap window', () => {
    vi.useFakeTimers()
    const store = createAppStore()
    store.dispatch(restartGame())

    const view = render(
      <Provider store={store}>
        <TouchHarness />
      </Provider>,
    )
    const board = view.getByTestId('board')
    mockBoardRect(board)

    fireEvent.pointerDown(board, { pointerId: 1, isPrimary: true, pointerType: 'touch', clientX: 110, clientY: 100 })
    fireEvent.pointerUp(board, { pointerId: 1, isPrimary: true, pointerType: 'touch', clientX: 110, clientY: 100 })

    act(() => {
      vi.advanceTimersByTime(221)
    })

    expect(selectActiveTile(store.getState())?.x).toBe(2)
  })

  it('soft drops on a downward swipe', () => {
    const store = createAppStore()
    store.dispatch(restartGame())

    const view = render(
      <Provider store={store}>
        <TouchHarness />
      </Provider>,
    )
    const board = view.getByTestId('board')
    mockBoardRect(board)

    fireEvent.pointerDown(board, { pointerId: 2, isPrimary: true, pointerType: 'touch', clientX: 220, clientY: 100 })
    fireEvent.pointerUp(board, { pointerId: 2, isPrimary: true, pointerType: 'touch', clientX: 220, clientY: 160 })

    expect(selectActiveTile(store.getState())?.y).toBe(1)
  })

  it('hard drops on a double tap without also moving to the tapped column', () => {
    vi.useFakeTimers()
    const store = createAppStore()
    store.dispatch(restartGame())

    const view = render(
      <Provider store={store}>
        <TouchHarness />
      </Provider>,
    )
    const board = view.getByTestId('board')
    mockBoardRect(board)

    fireEvent.pointerDown(board, { pointerId: 3, isPrimary: true, pointerType: 'touch', clientX: 88, clientY: 100 })
    fireEvent.pointerUp(board, { pointerId: 3, isPrimary: true, pointerType: 'touch', clientX: 88, clientY: 100 })
    fireEvent.pointerDown(board, { pointerId: 4, isPrimary: true, pointerType: 'touch', clientX: 88, clientY: 100 })
    fireEvent.pointerUp(board, { pointerId: 4, isPrimary: true, pointerType: 'touch', clientX: 88, clientY: 100 })

    act(() => {
      vi.advanceTimersByTime(221)
    })

    expect(selectLockedTiles(store.getState())[0]?.x).toBe(5)
    expect(selectActiveTile(store.getState())?.letter).toBe('A')
  })

  it('ignores a delayed single tap after the active tile changes', () => {
    vi.useFakeTimers()
    const store = createAppStore()
    store.dispatch(restartGame())

    const view = render(
      <Provider store={store}>
        <TouchHarness />
      </Provider>,
    )
    const board = view.getByTestId('board')
    mockBoardRect(board)

    fireEvent.pointerDown(board, { pointerId: 5, isPrimary: true, pointerType: 'touch', clientX: 110, clientY: 100 })
    fireEvent.pointerUp(board, { pointerId: 5, isPrimary: true, pointerType: 'touch', clientX: 110, clientY: 100 })

    act(() => {
      store.dispatch(hardDropActiveTile())
    })
    const nextTileXBeforeTimer = selectActiveTile(store.getState())?.x

    act(() => {
      vi.advanceTimersByTime(221)
    })

    expect(selectActiveTile(store.getState())?.x).toBe(nextTileXBeforeTimer)
  })

  it('treats a fast second tap in a different column as a new target instead of a hard drop', () => {
    vi.useFakeTimers()
    const store = createAppStore()
    store.dispatch(restartGame())

    const view = render(
      <Provider store={store}>
        <TouchHarness />
      </Provider>,
    )
    const board = view.getByTestId('board')
    mockBoardRect(board)

    fireEvent.pointerDown(board, { pointerId: 6, isPrimary: true, pointerType: 'touch', clientX: 88, clientY: 100 })
    fireEvent.pointerUp(board, { pointerId: 6, isPrimary: true, pointerType: 'touch', clientX: 88, clientY: 100 })
    fireEvent.pointerDown(board, { pointerId: 7, isPrimary: true, pointerType: 'touch', clientX: 330, clientY: 100 })
    fireEvent.pointerUp(board, { pointerId: 7, isPrimary: true, pointerType: 'touch', clientX: 330, clientY: 100 })

    act(() => {
      vi.advanceTimersByTime(221)
    })

    expect(selectLockedTiles(store.getState())).toHaveLength(0)
    expect(selectActiveTile(store.getState())?.x).toBe(7)
  })
})
