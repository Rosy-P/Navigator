export interface Facility {
    id: string;
    name: string;
    category: string;
    description: string;
    status: 'Open' | 'Closed' | 'Crowded';
    occupancy: number;
    distance: string | null;
    rating: number;
    total_ratings: number;
    image: string;
    latitude: number;
    longitude: number;
    hours?: string;
    phone?: string;
}
