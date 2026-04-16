import { create } from 'zustand';
import { Resource } from '../types';

// Mock data
const mockResources: Resource[] = [
  {
    id: 'r1',
    title: 'Comprendre le diabète de type 1',
    description: 'Un article complet sur les causes, symptômes et traitements du diabète de type 1.',
    category: 'article',
    url: '#',
    thumbnailUrl: 'https://images.pexels.com/photos/7089401/pexels-photo-7089401.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    tags: ['diabète', 'type 1', 'traitement'],
    createdAt: new Date('2023-01-10'),
    isFavorite: true
  },
  {
    id: 'r2',
    title: 'Témoignage: Vivre avec l\'hypertension',
    description: 'Marie partage son expérience de vie avec l\'hypertension et ses conseils.',
    category: 'testimonial',
    url: '#',
    thumbnailUrl: 'https://images.pexels.com/photos/3807738/pexels-photo-3807738.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    tags: ['hypertension', 'témoignage', 'gestion'],
    createdAt: new Date('2023-02-15')
  },
  {
    id: 'r3',
    title: 'Exercices respiratoires pour l\'asthme',
    description: 'Vidéo démontrant des exercices respiratoires efficaces pour les personnes asthmatiques.',
    category: 'video',
    url: '#',
    thumbnailUrl: 'https://images.pexels.com/photos/4498362/pexels-photo-4498362.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    tags: ['asthme', 'exercices', 'respiration'],
    createdAt: new Date('2023-03-05')
  },
  {
    id: 'r4',
    title: 'Podcast: Innovations en cardiologie',
    description: 'Le Dr. Ahmed discute des dernières avancées en cardiologie pour les maladies chroniques.',
    category: 'podcast',
    url: '#',
    thumbnailUrl: 'https://images.pexels.com/photos/4226119/pexels-photo-4226119.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    tags: ['cardiologie', 'innovations', 'recherche'],
    createdAt: new Date('2023-04-20')
  }
];

interface ResourceState {
  resources: Resource[];
  filteredResources: Resource[];
  isLoading: boolean;
  activeFilter: string;
  activeCategory: string;
  searchTerm: string;
  
  setFilter: (filter: string) => void;
  setCategory: (category: string) => void;
  setSearchTerm: (term: string) => void;
  toggleFavorite: (resourceId: string) => void;
}

export const useResourceStore = create<ResourceState>((set, get) => ({
  resources: mockResources,
  filteredResources: mockResources,
  isLoading: false,
  activeFilter: 'all',
  activeCategory: 'all',
  searchTerm: '',
  
  setFilter: (filter) => {
    set({ activeFilter: filter });
    applyFilters(get());
  },
  
  setCategory: (category) => {
    set({ activeCategory: category });
    applyFilters(get());
  },
  
  setSearchTerm: (term) => {
    set({ searchTerm: term });
    applyFilters(get());
  },
  
  toggleFavorite: (resourceId) => {
    set(state => ({
      resources: state.resources.map(resource => 
        resource.id === resourceId 
          ? { ...resource, isFavorite: !resource.isFavorite }
          : resource
      )
    }));
    
    applyFilters(get());
  }
}));

// Helper function to apply all filters
const applyFilters = (state: ResourceState) => {
  const { resources, activeFilter, activeCategory, searchTerm } = state;
  
  let filtered = resources;
  
  // Apply favorite filter
  if (activeFilter === 'favorites') {
    filtered = filtered.filter(resource => resource.isFavorite);
  }
  
  // Apply category filter
  if (activeCategory !== 'all') {
    filtered = filtered.filter(resource => resource.category === activeCategory);
  }
  
  // Apply search term
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(resource => 
      resource.title.toLowerCase().includes(term) || 
      resource.description.toLowerCase().includes(term) ||
      resource.tags.some(tag => tag.toLowerCase().includes(term))
    );
  }
  
  useResourceStore.setState({ filteredResources: filtered });
};