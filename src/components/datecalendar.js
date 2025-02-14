import React from 'react';
import Card from '../components/card'; // adjust the path as necessary

// UserInfo Component
const UserInfo = ({ name, role }) => {
  return (
    <div className="flex flex-col self-stretch my-auto">
      <div className="text-base font-medium text-indigo-950">{name}</div>
      <div className="self-start mt-1 text-sm leading-none text-slate-500">{role}</div>
    </div>
  );
};

// UserAvatar Component
const UserAvatar = ({ src, rounded = false }) => {
  return (
    <img
      loading="lazy"
      src={src}
      alt=""
      className={`object-contain shrink-0 self-stretch my-auto w-12 aspect-square ${
        rounded ? 'rounded-2xl w-[60px]' : 'rounded-none'
      }`}
    />
  );
};

// UserProfile Component
const UserProfile = ({ avatarSrc, badgeSrc, name, role }) => {
  return (
    <div className="flex gap-6 items-center whitespace-nowrap rounded-none">
      <UserAvatar src={avatarSrc} />
      <UserAvatar src={badgeSrc} rounded />
      <UserInfo name={name} role={role} />
    </div>
  );
};

const DateCalendar = () => {
  return (
    <div>
      {/* Header container: centered title with UserProfile in the top right */}
      <div style={{ position: 'relative', padding: '0 100px', marginBottom: '20px' }}>
        <div style={{ fontSize: 30, textAlign: 'center' }}>
          Pick a plan that works for you
        </div>
        <div style={{ position: 'absolute', top: 0, right: 0 }}>
          <UserProfile
            avatarSrc="/path/to/avatar.jpg"
            badgeSrc="/path/to/badge.jpg"
            name="John Doe"
            role="Admin"
          />
        </div>
      </div>

      {/* Individual date section */}
      <div style={{ textAlign: 'center', fontSize: 24, marginBottom: '20px' }}>
        Individual date
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px', // controls space between cards
          padding: '0 100px', // horizontal padding
          marginLeft: '150px'
        }}
      >
        <Card>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            Your card content goes here.
          </div>
        </Card>
        <Card>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            Your card content goes here.
          </div>
        </Card>
        <Card>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            Your card content goes here.
          </div>
        </Card>
      </div>

      {/* Bundle date package section */}
      <div style={{ textAlign: 'center', fontSize: 24, marginTop: '20px' }}>
        Bundle date package
      </div>
      <div
        style={{
          marginTop: '40px', // adds space between the two groups
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px',
          padding: '0 100px',
          marginLeft: '150px'
        }}
      >
        <Card>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            Your second group card content goes here.
          </div>
        </Card>
        <Card>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            Your second group card content goes here.
          </div>
        </Card>
        <Card>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            Your second group card content goes here.
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DateCalendar;
