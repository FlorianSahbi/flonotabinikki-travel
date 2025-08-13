import { render } from '@testing-library/react'
import ExplorePage from '../page'
import { supabase } from '@/lib/supabaseClient'

// Mock the supabase client
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        not: jest.fn(() => ({
          not: jest.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        }))
      }))
    }))
  }
}))

// Mock the ExploreMap component
jest.mock('@/components/explore/ExploreMap', () => {
  return function MockExploreMap({ points }: { points: any[] }) {
    return (
      <div data-testid="explore-map">
        ExploreMap with {points.length} points
      </div>
    )
  }
})

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('ExplorePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch data and render ExploreMap with points', async () => {
    const mockData = [
      { id: '1', lat: 35.6762, lng: 139.6503 },
      { id: '2', lat: 34.0522, lng: -118.2437 },
    ]

    // Setup the mock chain
    const mockNot2 = jest.fn(() => Promise.resolve({ data: mockData, error: null }))
    const mockNot1 = jest.fn(() => ({ not: mockNot2 }))
    const mockSelect = jest.fn(() => ({ not: mockNot1 }))
    mockSupabase.from.mockReturnValue({ select: mockSelect } as any)

    const component = await ExplorePage()
    const { container } = render(component)

    // Verify Supabase query was called correctly
    expect(mockSupabase.from).toHaveBeenCalledWith('videos')
    expect(mockSelect).toHaveBeenCalledWith('id, lat, lng')
    expect(mockNot1).toHaveBeenCalledWith('lat', 'is', null)
    expect(mockNot2).toHaveBeenCalledWith('lng', 'is', null)

    // Verify ExploreMap receives the correct points
    expect(container.textContent).toContain('ExploreMap with 2 points')
  })

  it('should handle empty data from Supabase', async () => {
    // Setup empty data response
    const mockNot2 = jest.fn(() => Promise.resolve({ data: null, error: null }))
    const mockNot1 = jest.fn(() => ({ not: mockNot2 }))
    const mockSelect = jest.fn(() => ({ not: mockNot1 }))
    mockSupabase.from.mockReturnValue({ select: mockSelect } as any)

    const component = await ExplorePage()
    const { container } = render(component)

    // Verify ExploreMap receives empty array when data is null
    expect(container.textContent).toContain('ExploreMap with 0 points')
  })

  it('should handle undefined data from Supabase', async () => {
    // Setup undefined data response
    const mockNot2 = jest.fn(() => Promise.resolve({ data: undefined, error: null }))
    const mockNot1 = jest.fn(() => ({ not: mockNot2 }))
    const mockSelect = jest.fn(() => ({ not: mockNot1 }))
    mockSupabase.from.mockReturnValue({ select: mockSelect } as any)

    const component = await ExplorePage()
    const { container } = render(component)

    // Verify ExploreMap receives empty array when data is undefined
    expect(container.textContent).toContain('ExploreMap with 0 points')
  })

  it('should handle Supabase error gracefully', async () => {
    // Setup error response
    const mockNot2 = jest.fn(() => Promise.resolve({ data: null, error: { message: 'Database error' } }))
    const mockNot1 = jest.fn(() => ({ not: mockNot2 }))
    const mockSelect = jest.fn(() => ({ not: mockNot1 }))
    mockSupabase.from.mockReturnValue({ select: mockSelect } as any)

    const component = await ExplorePage()
    const { container } = render(component)

    // Even with error, component should still render with empty array
    expect(container.textContent).toContain('ExploreMap with 0 points')
  })
})