import React, { useState, useEffect, useRef } from "react";

type Option = { label: string; value: string };
interface CustomSelectProps {
  options: Option[];
  initialValue?: string;
  onChange?: (value: string) => void;
}

const CustomSelect = ({
  options,
  initialValue,
  onChange,
}: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const defaultOption =
    options.find((o) => o.value === initialValue) || options[0];

  const [selectedOption, setSelectedOption] = useState<Option>(defaultOption);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newOption = options.find((o) => o.value === initialValue);
    if (newOption) {
      setSelectedOption(newOption);
    }
  }, [initialValue, options]);

  const handleClickOutside = (event: any) => {
    if (selectRef.current && !selectRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (option: Option) => {
    if (selectedOption.value !== option.value) {
      setSelectedOption(option);
      onChange?.(option.value);
    }
    setIsOpen(false);
  };

  return (
    <div
      className="custom-select custom-select-2 flex-shrink-0 relative"
      ref={selectRef}
    >
      <div
        className={`select-selected whitespace-nowrap ${
          isOpen ? "select-arrow-active" : ""
        }`}
        onClick={toggleDropdown}
      >
        {selectedOption.label}
      </div>

      <div className={`select-items ${isOpen ? "" : "select-hide"}`}>
        {options.map((option) => (
          <div
            key={option.value}
            onClick={() => handleOptionClick(option)}
            className={`select-item ${
              selectedOption.value === option.value ? "same-as-selected" : ""
            }`}
          >
            {option.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomSelect;
