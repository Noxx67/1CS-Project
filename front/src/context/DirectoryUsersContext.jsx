import { createContext, useContext, useState } from 'react';

const DirectoryUsersContext = createContext(null);

export function DirectoryUsersProvider({ children }) {
  const [directoryUsers, setDirectoryUsers] = useState([]);

  return (
    <DirectoryUsersContext.Provider value={{ directoryUsers, setDirectoryUsers }}>
      {children}
    </DirectoryUsersContext.Provider>
  );
}

export function useDirectoryUsers() {
  return useContext(DirectoryUsersContext);
}
