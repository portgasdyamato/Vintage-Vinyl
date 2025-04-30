import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import rem from '../assets/rem.png'; 
import Remove from './Remove';

const AnimatedItem = ({ children, delay = 0, index, onMouseEnter, onClick }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.5, triggerOnce: false });
  return (
    <motion.div
      ref={ref}
      data-index={index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
      transition={{ duration: 0.2, delay }}
      className="cursor-pointer"
    >
      {children}
    </motion.div>
  );
};

const AnimatedList = ({
  items = [],
  onItemSelect,
  handleRemove, // Add handleRemove as a prop
  className = '',
  itemClassName = '',
}) => {
  return (
    <div className={`relative w-[500px] ${className}`}>
      <div className="max-h-[400px] overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
        {items.map((item, index) => (
          <AnimatedItem
            key={index}
            index={index}
            onClick={() => onItemSelect(index)} // Start playback when the item is clicked
          >
            <div
              className={`flex items-center justify-between p-4 bg-[#111] rounded-lg hover:bg-[#222] ${itemClassName}`}
              style={{ marginBottom: '10px', padding: '8px', width: '80%' }}
            >
              {/* Title */}
              <p className="text-white text-center flex-1 m-0">{item.title}</p>

              {/* Remove Button */}
              <Remove
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering the parent onClick
                  handleRemove(index); // Call handleRemove with the index
                }}
              />
            </div>
          </AnimatedItem>
        ))}
      </div>
    </div>
  );
};

export default AnimatedList;
