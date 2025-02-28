import React from 'react';

const Card = ({ children }) => {
  return (
    <div className="flex rounded-3xl bg-zinc-100 max-w-[285px] min-h-[411px] shadow-[0px_4px_20px_rgba(0,0,0,0.25)]">
      {children}
    </div>
  );
};

export default Card;