
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  linkWithCredential,
  EmailAuthProvider,
  signInAnonymously,
  type User as FirebaseUser,
  type UserCredential,
  type Auth,
  fetchSignInMethodsForEmail,
  updatePassword,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  applyActionCode,
  checkActionCode,
  type ActionCodeSettings,
  updateEmail,
  reauthenticateWithCredential,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  updateDoc,
  writeBatch,
  onSnapshot,
} from 'firebase/firestore';
import { useAuth as useFirebaseAuth, useFirestore, initializeFirebase } from '@/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { Address, ZippUser, Vendor } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { logActivity } from '@/lib/activity-logger';
import { withTimeout } from '@/lib/withTimeout';

interface AuthContextType {
  user: ZippUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (
    email: string,
    pass: string,
    data: {
      name: string;
      role: 'user' | 'vendor';
      phone: string;
      address: Address;
      companyName?: string;
      claimedVendorId?: string | null;
      dob: string | null;
      gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
      profession: string | null;
    }
  ) => Promise<{ redirectPath: string }>;
  logout: () => Promise<any>;
  sendResetEmail: (email: string) => Promise<{ success: boolean, error?: any }>;
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean, error?: any }>;
  requestManualVerification: (vendor: Vendor) => Promise<void>;
  getFirebaseAuth: () => Auth;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ZippUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  const auth = useFirebaseAuth();
  const db = useFirestore();
  const router = useRouter();

  useEffect(() => {
    let unsubscribeProfile: () => void = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      unsubscribeProfile(); // Unsubscribe from any previous profile listener

      if (firebaseUser) {
        setLoading(true);
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // This is the critical change. We now force a server read on auth change.
        // Then we set up the real-time listener.
        getDoc(userDocRef).then(docSnap => {
            if (docSnap.exists()) {
                 const userData = { uid: firebaseUser.uid, ...docSnap.data() } as ZippUser;
                 setUser(userData);
            } else {
                 setUser(null);
            }
            setLoading(false); // Loading is complete after the initial server read.

            // Now, set up the real-time listener for subsequent updates.
            unsubscribeProfile = onSnapshot(userDocRef, (snap) => {
                if (snap.exists()) {
                    setUser({ uid: firebaseUser.uid, ...snap.data() } as ZippUser);
                } else {
                    setUser(null);
                }
            });
        }).catch(error => {
            console.error("Error fetching user profile after auth change:", error);
            setUser(null);
            setLoading(false);
        });

      } else {
        // No Firebase user found, so no profile to fetch. Loading is complete.
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
    };
  }, [auth, db]);


  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
    router.push('/'); 
  };

  const signup = async (
    email: string,
    pass: string,
    data: {
      name: string;
      role: 'user' | 'vendor';
      phone: string;
      address: Address;
      companyName?: string;
      claimedVendorId?: string | null;
      dob: string | null;
      gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
      profession: string | null;
    }
  ): Promise<{ redirectPath: string }> => {
    const { claimedVendorId } = data;
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, { displayName: data.name });
      
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      let redirectPath = '/signup-success';

      if (claimedVendorId) {
          const userDocData: Partial<ZippUser> = {
              name: data.name,
              email, phone: data.phone, role: 'vendor',
              address: data.address, region: data.address.country,
              updatedAt: serverTimestamp(),
              createdAt: serverTimestamp(),
              vendorId: claimedVendorId,
              dob: null, gender: null, profession: null,
          };
          await setDoc(userDocRef, userDocData, { merge: true });

          const vendorDocRef = doc(db, 'vendors', claimedVendorId);
          await updateDoc(vendorDocRef, {
              subscriptionStatus: 'claimed_pending_approval',
              claimedBy: firebaseUser.uid,
              updatedAt: serverTimestamp(),
          });
          
          redirectPath = '/claim-success';

      } else if (data.role === 'vendor') {
          const newUserDoc: Partial<ZippUser> & { address: { country: string } } = {
            name: data.name,
            email: firebaseUser.email,
            phone: data.phone,
            role: 'vendor',
            region: data.address.country,
            address: { ...data.address, country: data.address.country },
            dob: null, gender: null, profession: null,
            vendorId: firebaseUser.uid, 
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          
          const vendorDocRef = doc(db, 'vendors', firebaseUser.uid);
          const newVendorDoc = {
              name: data.companyName,
              normalizedName: data.companyName?.toLowerCase(),
              email: firebaseUser.email,
              phone: data.phone,
              address: data.address.line1,
              categoryId: '',
              subscriptionStatus: 'claimed_pending_approval',
              claimedBy: firebaseUser.uid,
              modulesEnabled: ['reviews', 'offerings', 'promotions'],
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              region: data.address.country,
              googleRating: 0, googleReviewCount: 0,
              zippRating: 0, zippReviewCount: 0,
              tags: [], offerings: [], reviews: [], promotions: [],
          };
          
          await setDoc(userDocRef, newUserDoc, { merge: true });
          await setDoc(vendorDocRef, newVendorDoc);
          redirectPath = '/claim-success';

      } else { 
          const newUserDoc: Partial<ZippUser> = {
            name: data.name,
            email: firebaseUser.email,
            phone: data.phone,
            role: 'user',
            region: data.address.country,
            address: data.address,
            dob: data.dob,
            gender: data.gender,
            profession: data.profession,
            favourites: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(userDocRef, newUserDoc, { merge: true });
          redirectPath = '/signup-success';
      }

      return { redirectPath };

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already associated with another account. Please log in or use a different email.');
      }
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const sendResetEmail = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      let message = "An unknown error occurred.";
      if (error.code === 'auth/user-not-found') {
        message = "No account found with this email address.";
      }
      return { success: false, error: message };
    }
  };
  
  const changePassword = async (currentPass: string, newPass: string) => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !firebaseUser.email) {
      return { success: false, error: "No authenticated user found." };
    }

    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPass);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPass);
      
      return { success: true };
    } catch (error: any) {
      let message = "An unknown error occurred.";
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = "The current password you entered is incorrect.";
      } else if (error.code === 'auth/weak-password') {
        message = "The new password is too weak. It must be at least 6 characters.";
      }
      return { success: false, error: message };
    }
  };

  const requestManualVerification = async (vendor: Vendor): Promise<void> => {
      await updateDoc(doc(db, 'vendors', vendor.id), {
        subscriptionStatus: 'claimed_pending_approval',
      });
  };

  const getFirebaseAuth = () => auth;

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout,
    sendResetEmail,
    changePassword,
    requestManualVerification,
    getFirebaseAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
