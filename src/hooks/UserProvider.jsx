import { createContext, useContext } from "react";
import { useUser } from "./useUser";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const userState = useUser();
  return (
    <UserContext.Provider value={userState}>
      {children}
    </UserContext.Provider>
  );
};

export const useAuth = () => useContext(UserContext);