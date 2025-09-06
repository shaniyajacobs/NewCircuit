// // adding a page after profile.js before location screen asking sexual preference and orientation
// import styled from 'styled-components';
// import circuitLogo from '../images/Cir_Primary_RGB_Mixed White.PNG';
// import React, { useState } from 'react';
// import { FooterShapes } from './Login';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { auth, db } from "./firebaseConfig";
// import { doc, updateDoc } from "firebase/firestore";

// const PreferencePage = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { userData } = location.state || {};
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
  
//   const [formData, setFormData] = useState({
//     gender: '',
//     sexualPreference: ''
//   });
  
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');

//     try {
//       if (!auth.currentUser) {
//         throw new Error('No authenticated user found');
//       }

//       // Update the user's document in Firestore
//       const userRef = doc(db, "users", auth.currentUser.uid);
//       await updateDoc(userRef, {
//         gender: formData.gender,
//         sexualPreference: formData.sexualPreference,
//         preferencesComplete: true,
//         updatedAt: new Date()
//       });

//       // Navigate to the next page with the updated data
//       navigate('/locations', {
//         state: {
//           userData: { 
//             ...userData, 
//             gender: formData.gender, 
//             sexualPreference: formData.sexualPreference 
//           }
//         }
//       });
//     } catch (error) {
//       console.error("Error saving preferences:", error);
//       setError(error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <PageContainer>
//       <FooterShapes />
//       <ContentWrapper>
//         <Logo href="/">
//           <img src={circuitLogo} alt="Circuit Logo" />
//         </Logo>
//         <h1>Tell Us More About You</h1>
        
//         {error && (
//           <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>
//             {error}
//           </div>
//         )}

//         <Form onSubmit={handleSubmit}>
//           <InputGroup>
//             <Label>Gender</Label>
//             <Select 
//               value={formData.gender} 
//               onChange={(e) => setFormData({...formData, gender: e.target.value})} 
//               required>
//               <option value="">Select your gender</option>
//               <option value="Male">Male</option>
//               <option value="Female">Female</option>
//               <option value="Non-binary">Non-binary</option>
//               <option value="Other">Other</option>
//               <option value="Prefer not to say">Prefer not to say</option>
//             </Select>
//           </InputGroup>
          
//           <InputGroup>
//             <Label>Sexual Preference</Label>
//             <Select 
//               value={formData.sexualPreference} 
//               onChange={(e) => setFormData({...formData, sexualPreference: e.target.value})} 
//               required>
//               <option value="">Select your preference</option>
//               <option value="Men">Men</option>
//               <option value="Women">Women</option>
//               <option value="Both">Both</option>
//               <option value="Other">Other</option>
//               <option value="Prefer not to say">Prefer not to say</option>
//             </Select>
//           </InputGroup>

//           <Button type="submit" disabled={loading}>
//             {loading ? "Saving..." : "Continue"}
//           </Button>
//         </Form>
//       </ContentWrapper>
//     </PageContainer>
//   );
// };

// const PageContainer = styled.div`
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: flex-start;
//   min-height: 100vh;
//   background-color: #211f20;
//   padding: 20px;
// `;

// const Logo = styled.h1`
//   display: flex;
//   align-items: center;
//   font-size: 2.5rem;
//   color: #000;
//   margin-bottom: 2rem;
//   text-decoration: none;

//   img {
//     height: 80px;
//     width: auto;
//   }
// `;

// const Form = styled.form`
//   background: white;
//   padding: 2rem;
//   border-radius: 12px;
//   width: 100%;
//   max-width: 600px;  
//   min-width: 320px;
//   box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
// `;

// const InputGroup = styled.div`
//   margin-bottom: 1.5rem;
// `;

// const Label = styled.label`
//   display: block;
//   margin-bottom: 0.5rem;
//   color: #000;
// `;

// const Select = styled.select`
//   width: 100%;
//   padding: 0.75rem;
//   border: 1px solid #ddd;
//   border-radius: 6px;
//   font-size: 1rem;
//   min-height: 42px;
// `;

// const Button = styled.button`
//   width: 100%;
//   padding: 0.75rem;
//   background-color: #211f20;
//   color: white;
//   border: none;
//   border-radius: 6px;
//   font-size: 1rem;
//   cursor: pointer;
//   margin-bottom: 1rem;

//   &:hover {
//     opacity: 0.9;
//   }
// `;

// const ContentWrapper = styled.div`
//   position: relative;
//   z-index: 1;
//   width: 100%;
//   height: 100%;
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: center;
//   padding: 40px 20px;
//   margin-top: -40px;
// `;

// export default PreferencePage;



import styled from 'styled-components';
import circuitLogo from '../images/Cir_Primary_RGB_Mixed White.PNG';
import React, { useState } from 'react';
import { FooterShapes } from './Login';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from "./firebaseConfig";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Other", "Prefer not to say"];
const PREF_OPTIONS = ["Men", "Women", "Non-binary", "Everyone", "Prefer not to say"];

const PreferencePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = location.state || {};
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    gender: '',
    genderOther: '',
    partnerPreference: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      if (!auth.currentUser) {
        throw new Error('No authenticated user found');
      }

      const normalizedGender = formData.gender === 'Other' && formData.genderOther.trim()
        ? formData.genderOther.trim()
        : formData.gender;

      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        gender: normalizedGender,
        partnerPreference: formData.partnerPreference,   // canonical
        sexualPreference: formData.partnerPreference,   // TEMP: dual-write for legacy readers
        preferencesComplete: true,
        updatedAt: serverTimestamp()
      });

      navigate('/locations', {
        state: {
          userData: {
            ...userData,
            gender: normalizedGender,
            partnerPreference: formData.partnerPreference
          }
        }
      });
    } catch (err) {
      console.error("Error saving preferences:", err);
      setError(err?.message || 'Something went wrong saving your preferences.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <FooterShapes />
      <ContentWrapper>
        <Logo to="/" aria-label="Go to home">
          <img src={circuitLogo} alt="Circuit logo" />
        </Logo>

        <h1 style={{ color: '#fff', marginBottom: '1rem', textAlign: 'center' }}>
          Tell Us More About You
        </h1>

        {error && <ErrorBanner role="alert">{error}</ErrorBanner>}

        <Form onSubmit={handleSubmit} noValidate>
          <InputGroup>
            <Label htmlFor="gender">Gender</Label>
            <Select
              id="gender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              required
              aria-label="Gender"
            >
              <option value="">Select your gender</option>
              {GENDER_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </Select>
          </InputGroup>

          {formData.gender === 'Other' && (
            <InputGroup>
              <Label htmlFor="genderOther">Specify gender</Label>
              <TextInput
                id="genderOther"
                type="text"
                placeholder="Enter your gender"
                value={formData.genderOther}
                onChange={(e) => setFormData({ ...formData, genderOther: e.target.value })}
                required
              />
            </InputGroup>
          )}

          <InputGroup>
            <Label htmlFor="partnerPreference">Partner Preference</Label>
            <SmallHint>Who you’re open to connecting with (you can change this anytime).</SmallHint>
            <Select
              id="partnerPreference"
              value={formData.partnerPreference}
              onChange={(e) => setFormData({ ...formData, partnerPreference: e.target.value })}
              required
              aria-label="Partner Preference"
            >
              <option value="">Select your preference</option>
              {PREF_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </Select>
          </InputGroup>

          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Continue"}
          </Button>
        </Form>
      </ContentWrapper>
    </PageContainer>
  );
};

/* --- styles unchanged from your last version --- */
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100vh;
  background-color: #211f20;
  padding: 20px;
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  text-decoration: none;

  img {
    height: 80px;
    width: auto;
    display: block;
  }
`;

const ErrorBanner = styled.div`
  color: #b00020;
  background: #fde7ea;
  border: 1px solid #f7c2c9;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  width: 100%;
  max-width: 600px;
  text-align: center;
`;

const Form = styled.form`
  background: #fff;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  min-width: 320px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
`;

const InputGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.25rem;
  color: #000;
  font-weight: 600;
`;

const SmallHint = styled.p`
  margin: 0 0 0.5rem 0;
  font-size: 0.85rem;
  color: #666;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  min-height: 42px;
  background: #fff;
`;

const TextInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  min-height: 42px;
  background: #fff;
`;

const Button = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: #211f20;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  margin-bottom: 0.25rem;
  transition: opacity .2s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  &:not(:disabled):hover {
    opacity: 0.9;
  }
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  min-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  margin-top: -40px;
`;

export default PreferencePage;