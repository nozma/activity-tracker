import React, { createContext, useContext, useState } from 'react';

const FilterContext = createContext();

export function FilterProvider({ children }) {
  const [filterState, setFilterState] = useState({
    groupFilter: ``,
    categoryFilter: ``,
    categoryFilterName: ``,
    activityNameFilter: ``,
  });

  return (
    <FilterContext.Provider value={{ filterState, setFilterState }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  return useContext(FilterContext);
}