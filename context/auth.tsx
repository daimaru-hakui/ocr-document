"use client";

import { auth } from "@/lib/firebase/client";
import {
  ParsedToken,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  User as firebaseUser,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { removeToken, setToken } from "./actions";

type AuthContextType = {
  currentUser: firebaseUser | null;
  customClaims: ParsedToken | null;
  logout: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<firebaseUser | null>(null);
  const [customClaims, setCustomClaims] = useState<ParsedToken | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        setCurrentUser(user);
        if (user) {
          const tokenResult = await user.getIdTokenResult();
          const token = tokenResult.token;
          const refreshToken = user.refreshToken;
          const claims = tokenResult.claims;
          setCustomClaims(claims ?? null);
          if (token && refreshToken) {
            await setToken({ token, refreshToken });
          }
        } else {
          await removeToken();
          setCurrentUser(null);
          setCustomClaims(null);
        }
      } catch (error) {
        console.log(error);
      }
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await auth.signOut();
    setCurrentUser(null);
    setCustomClaims(null);
  };

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password).catch((err) =>
      console.log(err),
    );
  };

  const resetPassword = async (email: string) => {
    sendPasswordResetEmail(auth, email)
      .then(() => {})
      .catch((error) => {
        console.log(error);
        alert("失敗しました。");
      });
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        customClaims,
        logout,
        loginWithEmail,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => useContext(AuthContext);
