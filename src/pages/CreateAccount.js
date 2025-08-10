import styled from 'styled-components';
import circuitLogo from '../images/Cir_Primary_RGB_Mixed White.PNG';
import React, { useState } from 'react';
import { FooterShapes } from './Login';
import { auth, storage } from './firebaseConfig';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import ImageUploading from 'react-images-uploading';
import { IoPersonCircle } from 'react-icons/io5';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';


const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #211f20;
  padding: 20px;
`;

const Logo = styled.h1`
  display: flex;
  align-items: center;
  font-size: 2.5rem;
  color: #000;
  margin-bottom: 2rem;
  text-decoration: none;

  img {
    height: 80px;
    width: auto;
  }
`;

const LoginForm = styled.form`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  min-width: 320px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const InputGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #000;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  min-height: 42px;
`;

const Button = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: ${props => props.secondary ? 'white' : '#211f20'};
  color: ${props => props.secondary ? '#000' : 'white'};
  border: ${props => props.secondary ? '1px solid #000' : 'none'};
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  margin-bottom: 1rem;

  &:hover {
    opacity: 0.9;
  }
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
`;

const CreateAccount = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [reenterPassword, setReenterPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = React.useState([]);
  const maxNumber = 1;

  const onChange = (imageList, addUpdateIndex) => {
    // data for submit
    setImages(imageList);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Email validation
      if (!email || !/\S+@\S+\.\S+/.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Check if email exists
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods && methods.length > 0) {
        setLoading(false);
        setError('This email is already registered. Please sign in or use a different email.');
        return;
      }

      // Password validation
      if (createPassword !== reenterPassword) {
        throw new Error('Passwords do not match');
      }

      if (createPassword.length < 6) {
        throw new Error('Password should be at least 6 characters');
      }

      let uploadedImages = null; // Start with null

      // Handle image upload if an image was selected
      if (images.length > 0) {
        try {
          // Create unique filename
          const timestamp = new Date().getTime();
          const filename = `${timestamp}_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
          const storageRef = ref(storage, `profilePictures/${filename}`);

          // Upload the file directly from the image data
          const imageData = images[0].data_url;
          const uploadTask = await uploadBytes(storageRef, dataURItoBlob(imageData));
          
          // Get the URL of the uploaded file
          const imageUrl = await getDownloadURL(uploadTask.ref);
          console.log('Image uploaded successfully. URL:', imageUrl);
          
          // Set the uploaded image URL
          uploadedImages = imageUrl;

        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error('Failed to upload profile picture. Please try again.');
        }
      }

      // Navigate to profile and log the image URL
      console.log('Image URL in create account:', uploadedImages);
      navigate('/profile', {
        state: {
          email: email,
          password: createPassword,
          image: uploadedImages // This will be either null or the image URL
        }
      });

    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to convert data URI to Blob
  const dataURItoBlob = (dataURI) => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    return new Blob([ab], { type: mimeString });
  };

  return (
    <LoginContainer>
      <FooterShapes />
      <ContentWrapper>
        <Logo href="/">
          <img src={circuitLogo} alt="Circuit Logo" />
        </Logo>
        <LoginForm onSubmit={handleSubmit}>
          {error && (
            <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>
              {error}
            </div>
          )}
          <ImageUploading
            multiple
            value={images}
            onChange={onChange}
            maxNumber={maxNumber}
            dataURLKey="data_url"
          >
            {({
              imageList,
              onImageUpload,
              onImageRemoveAll,
              onImageUpdate,
              onImageRemove,
              isDragging,
              dragProps,
            }) => (
              // write your building UI
              <div className="upload__image-wrapper">
                <div style={{flex: 1, flexDirection: 'column', justifyItems: 'center'}}>
                  
                  { imageList.length < maxNumber ? 
                  <button
                    style={isDragging ? { color: 'red' } : undefined}
                    onClick={onImageUpload}
                    {...dragProps}
                  >
                    Click or Drop here
                  </button> : <div/>
                  }
                
                  {imageList.length ? 
                  imageList.map((image, index) => (
                    <div key={index} className="image-item">
                      {/* <img
                        src={image['data_url']}
                        alt=""
                        resizeMode='fit'
                      /> */}
                      <img src={image['data_url']} alt="" width='100'/>
                    </div>
                  )) : 
                  <div
                    onClick={onImageUpload}
                  >
                    <IoPersonCircle style={{width: '100px', height: '100px'}}/>
                  </div>
                  }
                  <button onClick={onImageRemoveAll}>Remove image</button>
                </div>
              </div>
            )}
          </ImageUploading>
          
          <InputGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </InputGroup>

          <InputGroup>
            <Label htmlFor="createPassword">Create Password</Label>
            <Input
              type="password"
              id="createPassword"
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
              required
              disabled={loading}
            />
          </InputGroup>

          <InputGroup>
            <Label htmlFor="reenterPassword">Re-enter Password</Label>
            <Input
              type="password"
              id="reenterPassword"
              value={reenterPassword}
              onChange={(e) => setReenterPassword(e.target.value)}
              required
              disabled={loading}
            />
          </InputGroup>

          <Button type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Continue'}
          </Button>

          <Button 
            type="button" 
            secondary 
            onClick={() => navigate('/login')}
            disabled={loading}
          >
            Back to Sign In
          </Button>
        </LoginForm>
      </ContentWrapper>
    </LoginContainer>
  );
};

export default CreateAccount;
