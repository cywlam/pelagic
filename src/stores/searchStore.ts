import { create } from 'zustand';
import type { SearchResults, CommunitySearchResults, DiveTag } from '../types';

interface SearchState {
  searchResults: SearchResults | null;
  searchQuery: string;
  communityResults: CommunitySearchResults | null;
  communityLoading: boolean;
  activeDiveTagFilter: DiveTag | null;
}

interface SearchActions {
  setSearchResults: (results: SearchResults | null, query: string) => void;
  setCommunityResults: (results: CommunitySearchResults | null) => void;
  setCommunityLoading: (loading: boolean) => void;
  clearSearch: () => void;
  setDiveTagFilter: (tag: DiveTag | null) => void;
}

type SearchStore = SearchState & SearchActions;

export const useSearchStore = create<SearchStore>((set) => ({
  searchResults: null,
  searchQuery: '',
  communityResults: null,
  communityLoading: false,
  activeDiveTagFilter: null,

  setSearchResults: (results, query) =>
    set({ searchResults: results, searchQuery: query }),

  setCommunityResults: (results) =>
    set({ communityResults: results, communityLoading: false }),

  setCommunityLoading: (loading) =>
    set({ communityLoading: loading }),

  clearSearch: () =>
    set({ searchResults: null, searchQuery: '', communityResults: null, communityLoading: false }),

  setDiveTagFilter: (tag) =>
    set({ activeDiveTagFilter: tag }),
}));
