import { useState, useEffect } from "react";
import RangeSlider from "react-range-slider-input";
import "react-range-slider-input/dist/style.css";

interface PriceDropdownProps {
  minPrice?: number;
  maxPrice?: number;
  onPriceChange?: (minPrice: number, maxPrice: number) => void;
}

const PriceDropdown = ({
  minPrice = 0,
  maxPrice = 100000000,
  onPriceChange,
}: PriceDropdownProps) => {
  const [toggleDropdown, setToggleDropdown] = useState(true);

  const [selectedPrice, setSelectedPrice] = useState({
    from: minPrice,
    to: maxPrice,
  });

  // Update when minPrice/maxPrice change (only update 'to' if maxPrice changes)
  useEffect(() => {
    setSelectedPrice((prev) => ({
      from: minPrice, // Always start from minPrice (should be 0)
      to: maxPrice, // Update to new maxPrice
    }));
  }, [minPrice, maxPrice]);

  // Handle input change with validation
  const handleInputChange = (field: "from" | "to", value: string) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, "");

    if (numericValue === "") {
      setSelectedPrice((prev) => ({
        ...prev,
        [field]: 0,
      }));
      return;
    }

    const numValue = parseInt(numericValue, 10);

    // Ensure non-negative
    if (numValue < 0) {
      return;
    }

    if (field === "from") {
      // Ensure 'from' is less than 'to'
      const newFrom = Math.min(numValue, selectedPrice.to - 1);
      setSelectedPrice((prev) => ({
        ...prev,
        from: newFrom,
      }));
      onPriceChange?.(newFrom, selectedPrice.to);
    } else {
      // Ensure 'to' is greater than 'from'
      const newTo = Math.max(numValue, selectedPrice.from + 1);
      setSelectedPrice((prev) => ({
        ...prev,
        to: newTo,
      }));
      onPriceChange?.(selectedPrice.from, newTo);
    }
  };

  // Handle slider change
  const handleSliderChange = (values: number[]) => {
    const newFrom = Math.floor(values[0]);
    const newTo = Math.ceil(values[1]);
    setSelectedPrice({
      from: newFrom,
      to: newTo,
    });
    onPriceChange?.(newFrom, newTo);
  };

  return (
    <div className="bg-white shadow-1 rounded-lg">
      <div
        onClick={() => setToggleDropdown(!toggleDropdown)}
        className="cursor-pointer flex items-center justify-between py-3 pl-6 pr-5.5"
      >
        <p className="text-dark">Giá</p>
        <button
          onClick={() => setToggleDropdown(!toggleDropdown)}
          id="price-dropdown-btn"
          aria-label="button for price dropdown"
          className={`text-dark ease-out duration-200 ${
            toggleDropdown && "rotate-180"
          }`}
        >
          <svg
            className="fill-current"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M4.43057 8.51192C4.70014 8.19743 5.17361 8.161 5.48811 8.43057L12 14.0122L18.5119 8.43057C18.8264 8.16101 19.2999 8.19743 19.5695 8.51192C19.839 8.82642 19.8026 9.29989 19.4881 9.56946L12.4881 15.5695C12.2072 15.8102 11.7928 15.8102 11.5119 15.5695L4.51192 9.56946C4.19743 9.29989 4.161 8.82641 4.43057 8.51192Z"
              fill=""
            />
          </svg>
        </button>
      </div>

      {/* // <!-- dropdown menu --> */}
      <div className={`p-6 ${toggleDropdown ? "block" : "hidden"}`}>
        <div id="pricingOne">
          <div className="price-range">
            <RangeSlider
              id="range-slider-gradient"
              className="margin-lg"
              min={minPrice}
              max={maxPrice}
              value={[selectedPrice.from, selectedPrice.to]}
              step={1000}
              onInput={handleSliderChange}
            />

            <div className="price-amount flex items-center justify-between pt-4 gap-3">
              <div className="text-custom-xs text-dark-4 flex rounded border border-gray-3/80 flex-1">
                <span className="block border-r border-gray-3/80 px-2.5 py-1.5">
                  ₫
                </span>
                <input
                  type="text"
                  id="minAmount"
                  value={selectedPrice.from.toLocaleString("vi-VN")}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/[^0-9]/g, "");
                    handleInputChange("from", rawValue);
                  }}
                  onBlur={(e) => {
                    const rawValue = e.target.value.replace(/[^0-9]/g, "");
                    const numValue = parseInt(rawValue, 10) || 0;
                    if (numValue >= selectedPrice.to) {
                      handleInputChange(
                        "from",
                        (selectedPrice.to - 1).toString()
                      );
                    }
                  }}
                  className="block px-3 py-1.5 w-full outline-none"
                  placeholder="0"
                />
              </div>

              <span className="text-dark-4">-</span>

              <div className="text-custom-xs text-dark-4 flex rounded border border-gray-3/80 flex-1">
                <span className="block border-r border-gray-3/80 px-2.5 py-1.5">
                  ₫
                </span>
                <input
                  type="text"
                  id="maxAmount"
                  value={selectedPrice.to.toLocaleString("vi-VN")}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/[^0-9]/g, "");
                    handleInputChange("to", rawValue);
                  }}
                  onBlur={(e) => {
                    const rawValue = e.target.value.replace(/[^0-9]/g, "");
                    const numValue = parseInt(rawValue, 10) || maxPrice;
                    if (numValue <= selectedPrice.from) {
                      handleInputChange(
                        "to",
                        (selectedPrice.from + 1).toString()
                      );
                    }
                  }}
                  className="block px-3 py-1.5 w-full outline-none"
                  placeholder={maxPrice.toLocaleString("vi-VN")}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceDropdown;
