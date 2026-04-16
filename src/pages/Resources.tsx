import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { Search, Heart, BookOpen, Video, Headphones, MessageCircle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

// Fonction pour générer des images médicales pertinentes
const getMedicalImage = (id: string, category: string) => {
  const baseUrl = "https://source.unsplash.com/featured/400x200/?";
  
  const categories: Record<string, string> = {
    article: "medical-article",
    video: "medical-video",
    podcast: "medical-podcast",
    testimonial: "patient-story"
  };
  
  const tags: Record<string, string> = {
    '1': "diabetes",
    '2': "hypertension",
    '3': "asthma",
    '4': "cardiology",
    '5': "diabetes-nutrition",
    '6': "stress-management"
  };
  
  return `${baseUrl}${categories[category]},${tags[id]}`;
};

const Resources: React.FC = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const dateLocale = i18n.language === 'fr' ? fr : enUS;
  
  // Récupérer le paramètre de médicament depuis l'URL
  const queryParams = new URLSearchParams(location.search);
  const medicationName = queryParams.get('name');
  
  const filters = [
    { id: 'all', label: t('resources.filters.all') },
    { id: 'favorites', label: t('resources.filters.favorites') }
  ];
  
  const categories = [
    { id: 'all', label: t('common.all'), icon: <BookOpen size={16} /> },
    { id: 'article', label: t('resources.categories.articles'), icon: <BookOpen size={16} /> },
    { id: 'video', label: t('resources.categories.videos'), icon: <Video size={16} /> },
    { id: 'podcast', label: t('resources.categories.podcasts'), icon: <Headphones size={16} /> },
    { id: 'testimonial', label: t('resources.categories.testimonials'), icon: <MessageCircle size={16} /> }
  ];

  // Vraies ressources médicales avec liens fonctionnels
  const resources = [
    {
      id: '1',
      title: 'Comprendre le diabète de type 1',
      description: 'Article complet sur les causes, symptômes et traitements du diabète de type 1.',
      category: 'article',
      url: 'https://www.elsan.care/fr/pathologie-et-traitement/maladies-endocriniennes/diabete-type-1-causes-traitements',
      tags: ['diabète', 'type 1', 'maladie chronique'],
      isFavorite: false,
      createdAt: new Date(2023, 0, 10)
    },
    {
      id: '2',
      title: 'Témoignage: Vivre avec l\'hypertension',
      description: 'Marie partage son expérience de vie avec l\'hypertension et ses conseils.',
      category: 'testimonial',
      url: 'https://www.fedecardio.org/je-m-informe/temoignages/vivre-avec-lhypertension-arterielle/',
      tags: ['hypertension', 'témoignage', 'coeur'],
      isFavorite: false,
      createdAt: new Date(2023, 1, 15)
    },
    {
      id: '3',
      title: 'Exercices respiratoires pour l\'asthme',
      description: 'Vidéo démontrant des exercices respiratoires efficaces pour les personnes asthmatiques.',
      category: 'video',
      url: 'https://www.youtube.com/watch?v=1qzPRufSzn4',
      tags: ['asthme', 'exercices', 'respiration'],
      isFavorite: false,
      createdAt: new Date(2023, 2, 5)
    },
    {
      id: '4',
      title: 'Innovations en cardiologie',
      description: 'Podcast avec Dr Marie-Claude Morice sur les dernières avancées en cardiologie.',
      category: 'podcast',
      url: 'https://podcasts.apple.com/ca/podcast/cardiologie-interventionnelle-des-d%C3%A9cennies-dinnovations/id1536168440?i=1000689667344',
      tags: ['cardiologie', 'innovations', 'coeur'],
      isFavorite: false,
      createdAt: new Date(2023, 3, 20)
    },
    {
      id: '5',
      title: 'Guide de nutrition pour diabétiques',
      description: 'Conseils pratiques pour une alimentation équilibrée avec un diabète.',
      category: 'article',
      url: 'https://www.federationdesdiabetiques.org/diabete/alimentation',
      tags: ['diabète', 'nutrition', 'alimentation'],
      isFavorite: false,
      createdAt: new Date(2023, 4, 12)
    },
    {
      id: '6',
      title: 'Gérer le stress et l\'anxiété',
      description: 'Techniques de relaxation et gestion du stress au quotidien.',
      category: 'video',
      url: 'https://www.youtube.com/watch?v=z6X5oEIg6Ak',
      tags: ['stress', 'anxiété', 'santé mentale'],
      isFavorite: false,
      createdAt: new Date(2023, 5, 8)
    }
  ];

  const [filteredResources, setFilteredResources] = useState(resources);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    // Filtrer les ressources en fonction des sélections
    let result = resources;
    
    // Appliquer le filtre (tous/favoris)
    if (activeFilter === 'favorites') {
      result = result.filter(r => r.isFavorite);
    }
    
    // Appliquer la catégorie
    if (activeCategory !== 'all') {
      result = result.filter(r => r.category === activeCategory);
    }
    
    // Appliquer la recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.title.toLowerCase().includes(query) || 
        r.description.toLowerCase().includes(query) ||
        r.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    setFilteredResources(result);
  }, [activeFilter, activeCategory, searchQuery]);

  const toggleFavorite = (id: string) => {
    const index = resources.findIndex(r => r.id === id);
    if (index !== -1) {
      resources[index].isFavorite = !resources[index].isFavorite;
      setFilteredResources([...resources]);
    }
  };
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'article':
        return <BookOpen size={16} className="text-primary-500" />;
      case 'video':
        return <Video size={16} className="text-accent-500" />;
      case 'podcast':
        return <Headphones size={16} className="text-purple-500" />;
      case 'testimonial':
        return <MessageCircle size={16} className="text-green-500" />;
      default:
        return <BookOpen size={16} />;
    }
  };
  
  const formatDate = (date: Date) => {
    return format(date, 'dd MMM yyyy', { locale: dateLocale });
  };

  return (
    <Layout title={t('resources.title')}>
      <div className="mb-20">
        {/* En-tête avec le nom du médicament si spécifié */}
        {medicationName && (
          <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg p-4 mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {t('resources.medicationResources', { medication: medicationName })}
            </h2>
            <p className="text-gray-600">
              {t('resources.medicationResourcesDescription')}
            </p>
          </div>
        )}

        {/* Barre de recherche */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={20} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        
        {/* Filtres */}
        <div className="flex justify-between mb-4">
          <div className="flex space-x-2">
            {filters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  activeFilter === filter.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          
          <div className="flex space-x-2 overflow-x-auto">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1 transition-colors ${
                  activeCategory === category.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.icon}
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Grille de ressources */}
        {filteredResources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map(resource => (
              <div 
                key={resource.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative h-48">
                  {/* Image d'illustration pertinente */}
                  <img 
                    src={getMedicalImage(resource.id, resource.category)}
                    alt={resource.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://source.unsplash.com/featured/400x200/?medical,${resource.tags[0]}`;
                    }}
                  />
                  
                  {/* Badge de catégorie */}
                  <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    {getCategoryIcon(resource.category)}
                    <span>{t(`resources.categories.${resource.category}`)}</span>
                  </div>
                  
                  {/* Bouton Favori */}
                  <button 
                    className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm"
                    onClick={() => toggleFavorite(resource.id)}
                    aria-label={resource.isFavorite ? t('resources.removeFromFavorites') : t('resources.addToFavorites')}
                  >
                    <Heart 
                      size={18} 
                      className={resource.isFavorite ? 'text-error-500 fill-error-500' : 'text-gray-400'} 
                    />
                  </button>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold mb-1">{resource.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{resource.description}</p>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex flex-wrap gap-1">
                      {resource.tags.slice(0, 2).map((tag, index) => (
                        <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                      {resource.tags.length > 2 && (
                        <span className="text-gray-500 text-xs">+{resource.tags.length - 2}</span>
                      )}
                    </div>
                    
                    <span className="text-gray-500 text-xs">
                      {formatDate(resource.createdAt)}
                    </span>
                  </div>
                </div>
                
                <a 
                  href={resource.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-3 bg-gray-50 text-primary-600 text-center font-medium hover:bg-gray-100 transition-colors border-t flex items-center justify-center gap-2"
                >
                  <ExternalLink size={16} />
                  <span>{t('resources.viewResource')}</span>
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500">{t('resources.noResourcesFound')}</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Resources;