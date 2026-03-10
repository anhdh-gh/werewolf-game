import React, { useState, useEffect } from 'react';

const RoleDisplay = ({roleNameVN}) => {
  const [isVisible, setIsVisible] = useState(false);
  const hiddenStars = "**********";


  
  useEffect(() => {
    let timer;
    if (isVisible) {
      
      timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    }

   
    return () => clearTimeout(timer);
  }, [isVisible]);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <p>
        Vai trò của bạn: {' '}
        <span 
          onClick={() => setIsVisible(true)}
          style={{ 
            cursor: 'pointer', 
            fontWeight: 'bold',
            color: isVisible ? '#e74c3c' : '#e74c3c',
            transition: 'color 0.3s ease'
          }}
        >
          {isVisible ? roleNameVN: hiddenStars}
        </span>
      </p>
      <i><small style = {{fontSize : "7px"}}>(Click vào dấu sao để xem, tự ẩn sau 3s)</small></i>
      
    </div>
  );
};

export default RoleDisplay;