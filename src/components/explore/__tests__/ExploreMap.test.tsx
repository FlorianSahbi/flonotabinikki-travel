import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ExploreMap from '../ExploreMap'
import { useRouter } from 'next/navigation'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock mapbox-gl
const mockMap = {
  on: jest.fn(),
  addSource: jest.fn(),
  addLayer: jest.fn(),
  getSource: jest.fn(),
  jumpTo: jest.fn(),
  easeTo: jest.fn(),
  getCanvas: jest.fn(() => ({
    style: { cursor: '' }
  })),
  getCenter: jest.fn(() => ({ lng: 139.6503, lat: 35.6762 })),
  getZoom: jest.fn(() => 5),
  getPitch: jest.fn(() => 40),
  setPitch: jest.fn(),
  remove: jest.fn(),
}

const mockGeoJSONSource = {
  setData: jest.fn(),
}

jest.mock('mapbox-gl', () => ({
  Map: jest.fn(() => mockMap),
  accessToken: '',
}))

// Mock CSS import
jest.mock('mapbox-gl/dist/mapbox-gl.css', () => ({}))

// Mock environment variables
process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'test-token'

const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

describe('ExploreMap', () => {
  const mockPoints = [
    { id: '1', lat: 35.6762, lng: 139.6503 },
    { id: '2', lat: 34.0522, lng: -118.2437 },
    { id: '3', lat: 51.5074, lng: -0.1278 },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    } as any)

    // Clear localStorage mock
    global.localStorage.clear()
    
    // Reset map mocks
    mockMap.on.mockClear()
    mockMap.getSource.mockReturnValue(mockGeoJSONSource)

    // Mock URL constructor
    global.URL = jest.fn().mockImplementation(() => ({
      searchParams: {
        get: jest.fn().mockReturnValue(null)
      }
    }))

    // Mock URLSearchParams
    global.URLSearchParams = jest.fn().mockImplementation(() => ({
      set: jest.fn(),
      toString: jest.fn(() => '')
    }))
  })

  it('should render without errors', () => {
    const { container } = render(<ExploreMap points={mockPoints} />)
    
    // Should render the map container
    expect(container.querySelector('.h-dvh')).toBeInTheDocument()
  })

  it('should initialize map with correct configuration', () => {
    render(<ExploreMap points={mockPoints} />)

    expect(require('mapbox-gl').Map).toHaveBeenCalledWith({
      container: expect.any(HTMLDivElement),
      style: 'mapbox://styles/mapbox/standard',
      center: [138.0, 37.0],
      zoom: 4.2,
      pitch: 40,
      bearing: -10,
      attributionControl: false,
    })
  })

  it('should load saved map state from localStorage', () => {
    const savedState = JSON.stringify({
      center: [140.0, 38.0],
      zoom: 6.5,
      pitch: 45,
    })
    
    // Mock localStorage to return saved state
    jest.spyOn(global.localStorage, 'getItem').mockReturnValue(savedState)

    render(<ExploreMap points={mockPoints} />)

    expect(require('mapbox-gl').Map).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [140.0, 38.0],
        zoom: 6.5,
        pitch: 45,
      })
    )
  })

  it('should handle invalid localStorage data gracefully', () => {
    // Mock localStorage to return invalid JSON
    jest.spyOn(global.localStorage, 'getItem').mockReturnValue('invalid json')

    render(<ExploreMap points={mockPoints} />)

    // Should fall back to default values
    expect(require('mapbox-gl').Map).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [138.0, 37.0],
        zoom: 4.2,
        pitch: 40,
      })
    )
  })

  it('should add map source and layer on map load', async () => {
    render(<ExploreMap points={mockPoints} />)

    // Simulate map load event
    const onLoadCallback = mockMap.on.mock.calls.find(call => call[0] === 'load')[1]
    onLoadCallback()

    await waitFor(() => {
      expect(mockMap.addSource).toHaveBeenCalledWith('videos', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: mockPoints.map(p => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
            properties: { id: p.id },
          })),
        },
      })

      expect(mockMap.addLayer).toHaveBeenCalledWith({
        id: 'videos-points',
        type: 'circle',
        source: 'videos',
        paint: expect.any(Object),
      })
    })
  })

  it('should handle focus parameter from URL', async () => {
    // Mock URL constructor to return focus parameter
    global.URL = jest.fn().mockImplementation(() => ({
      searchParams: {
        get: jest.fn((key) => key === 'focus' ? '2' : null)
      }
    }))

    render(<ExploreMap points={mockPoints} />)

    // Simulate map load event
    const onLoadCallback = mockMap.on.mock.calls.find(call => call[0] === 'load')[1]
    onLoadCallback()

    await waitFor(() => {
      expect(mockMap.jumpTo).toHaveBeenCalledWith({
        center: [-118.2437, 34.0522], // coordinates of point with id '2'
        zoom: 7.5,
      })
    })
  })

  it('should show "Voir la story" button when focusId is set', async () => {
    const { rerender } = render(<ExploreMap points={mockPoints} />)
    
    // Initially no button should be visible
    expect(screen.queryByText('Voir la story')).not.toBeInTheDocument()

    // Simulate map load to register event handlers
    const onLoadCallback = mockMap.on.mock.calls.find(call => call[0] === 'load')[1]
    onLoadCallback()

    // Find the click event handler that was registered
    const onClickCallbacks = mockMap.on.mock.calls.filter(call => call[0] === 'click' && call[1] === 'videos-points')
    expect(onClickCallbacks).toHaveLength(1)
    const onClickCallback = onClickCallbacks[0][2]
    
    const mockEvent = {
      features: [{
        properties: { id: '1' },
        geometry: {
          type: 'Point',
          coordinates: [139.6503, 35.6762]
        }
      }]
    }

    // Mock URLSearchParams
    global.URLSearchParams = jest.fn().mockImplementation(() => ({
      set: jest.fn(),
      toString: jest.fn(() => 'focus=1')
    }))

    onClickCallback(mockEvent)

    await waitFor(() => {
      expect(screen.getByText('Voir la story')).toBeInTheDocument()
    })
  })

  it('should navigate to story when button is clicked', async () => {
    render(<ExploreMap points={mockPoints} />)
    
    // Simulate map load to register event handlers
    const onLoadCallback = mockMap.on.mock.calls.find(call => call[0] === 'load')[1]
    onLoadCallback()

    // Find the click event handler
    const onClickCallbacks = mockMap.on.mock.calls.filter(call => call[0] === 'click' && call[1] === 'videos-points')
    const onClickCallback = onClickCallbacks[0][2]
    
    const mockEvent = {
      features: [{
        properties: { id: '1' },
        geometry: {
          type: 'Point',
          coordinates: [139.6503, 35.6762]
        }
      }]
    }

    // Mock URLSearchParams
    global.URLSearchParams = jest.fn().mockImplementation(() => ({
      set: jest.fn(),
      toString: jest.fn(() => 'focus=1')
    }))

    onClickCallback(mockEvent)

    await waitFor(() => {
      const button = screen.getByText('Voir la story')
      fireEvent.click(button)
      expect(mockPush).toHaveBeenCalledWith('/stories/1')
    })
  })

  it('should update points when props change', () => {
    const { rerender } = render(<ExploreMap points={mockPoints} />)

    const newPoints = [
      { id: '4', lat: 40.7128, lng: -74.0060 },
    ]

    rerender(<ExploreMap points={newPoints} />)

    expect(mockGeoJSONSource.setData).toHaveBeenCalledWith({
      type: 'FeatureCollection',
      features: newPoints.map(p => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
        properties: { id: p.id },
      })),
    })
  })

  it('should save map state to localStorage on moveend', async () => {
    render(<ExploreMap points={mockPoints} />)

    // Simulate moveend event
    const onMoveEndCallback = mockMap.on.mock.calls.find(call => call[0] === 'moveend')[1]
    onMoveEndCallback()

    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      'exploreMapState',
      JSON.stringify({
        center: [139.6503, 35.6762],
        zoom: 5,
        pitch: 40,
      })
    )
  })

  it('should clean up map on unmount', () => {
    const { unmount } = render(<ExploreMap points={mockPoints} />)
    
    unmount()
    
    expect(mockMap.remove).toHaveBeenCalled()
  })

  it('should handle empty points array', () => {
    const { container } = render(<ExploreMap points={[]} />)
    
    // Should still render without errors
    expect(container.querySelector('.h-dvh')).toBeInTheDocument()
  })

  it('should set cursor style on point hover', async () => {
    const mockCanvas = { style: { cursor: '' } }
    mockMap.getCanvas.mockReturnValue(mockCanvas)
    
    render(<ExploreMap points={mockPoints} />)

    // Simulate map load to register event handlers
    const onLoadCallback = mockMap.on.mock.calls.find(call => call[0] === 'load')[1]
    onLoadCallback()

    // Find the mouseenter and mouseleave callbacks
    const onMouseEnterCallbacks = mockMap.on.mock.calls.filter(call => call[0] === 'mouseenter' && call[1] === 'videos-points')
    const onMouseLeaveCallbacks = mockMap.on.mock.calls.filter(call => call[0] === 'mouseleave' && call[1] === 'videos-points')
    
    expect(onMouseEnterCallbacks).toHaveLength(1)
    expect(onMouseLeaveCallbacks).toHaveLength(1)

    const onMouseEnterCallback = onMouseEnterCallbacks[0][2]
    const onMouseLeaveCallback = onMouseLeaveCallbacks[0][2]

    // Simulate mouseenter event
    onMouseEnterCallback()
    expect(mockCanvas.style.cursor).toBe('pointer')

    // Simulate mouseleave event
    onMouseLeaveCallback()
    expect(mockCanvas.style.cursor).toBe('')
  })
})