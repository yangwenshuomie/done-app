import { useEffect, useState } from 'react'
import { User, onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../firebase'

const provider = new GoogleAuthProvider()

export function useAuth() {
  // undefined = loading, null = signed out, User = signed in
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    return onAuthStateChanged(auth, setUser)
  }, [])

  const signIn = () => signInWithPopup(auth, provider)
  const logOut = () => signOut(auth)

  return { user, signIn, logOut }
}
