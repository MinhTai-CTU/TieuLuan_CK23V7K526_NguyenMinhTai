import React, { useState, useEffect } from "react";

type Option = {
  label: string;
  value: string;
};

type CustomSelectProps = {
  options: Option[];
  value?: string;
  onChange?: (value: string) => void;
};

const CustomSelect = ({ options, value, onChange }: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(
    options.find((opt) => opt.value === value) || options[0]
  );

  useEffect(() => {
    if (value) {
      const found = options.find((opt) => opt.value === value);
      if (found) {
        setSelectedOption(found);
      }
    }
  }, [value, options]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (option: Option) => {
    setSelectedOption(option);
    if (onChange) {
      onChange(option.value);
    }
    toggleDropdown();
  };

  useEffect(() => {
    // closing modal while clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (!(event.target as Element)?.closest(".dropdown-content")) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div
      className="dropdown-content custom-select relative"
      style={{ width: "200px" }}
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
        {options.map((option, index) => (
          <div
            key={option.value || index}
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
