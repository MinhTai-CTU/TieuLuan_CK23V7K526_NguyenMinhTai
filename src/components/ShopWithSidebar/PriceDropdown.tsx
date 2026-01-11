import { useState, useEffect } from "react";

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
  const [tempMin, setTempMin] = useState<string>(minPrice.toString());
  const [tempMax, setTempMax] = useState<string>(maxPrice.toString());

  useEffect(() => {
    setTempMin(minPrice.toString());
    setTempMax(maxPrice.toString());
  }, [minPrice, maxPrice]);

  const formatCurrency = (value: string) => {
    if (!value) return "";
    const number = parseInt(value.replace(/[^0-9]/g, ""), 10);
    if (isNaN(number)) return "";
    return number.toLocaleString("vi-VN");
  };

  const handleInputChange = (type: "min" | "max", value: string) => {
    const rawValue = value.replace(/[^0-9]/g, "");
    if (type === "min") {
      setTempMin(rawValue);
    } else {
      setTempMax(rawValue);
    }
  };

  const handleApplyFilter = () => {
    let newMin = parseInt(tempMin.replace(/[^0-9]/g, ""), 10) || 0;
    let newMax = parseInt(tempMax.replace(/[^0-9]/g, ""), 10) || 0;

    // Logic: Nếu Min > Max, tự động đổi chỗ
    if (newMin > newMax && newMax !== 0) {
      const temp = newMin;
      newMin = newMax;
      newMax = temp;
      setTempMin(newMin.toString());
      setTempMax(newMax.toString());
    }

    if (newMax === 0) newMax = 100000000;

    console.log("Đã nhấn Áp dụng. Giá trị:", newMin, newMax); // Kiểm tra log

    // Gọi hàm từ cha để kích hoạt API
    onPriceChange?.(newMin, newMax);
  };

  return (
    <div className="bg-white shadow-1 rounded-lg">
      <div
        onClick={() => setToggleDropdown(!toggleDropdown)}
        className="cursor-pointer flex items-center justify-between py-3 pl-6 pr-5.5"
      >
        <p className="text-dark font-medium">Khoảng giá</p>
        <button
          // QUAN TRỌNG: Phải có type="button" để không trigger form submit ở cha
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setToggleDropdown(!toggleDropdown);
          }}
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

      <div className={`px-6 pb-6 pt-2 ${toggleDropdown ? "block" : "hidden"}`}>
        <div className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="minPrice"
              className="text-sm text-gray-500 mb-1 block"
            >
              Từ (đ)
            </label>
            <div className="relative">
              <input
                type="text"
                id="minPrice"
                value={formatCurrency(tempMin)}
                onChange={(e) => handleInputChange("min", e.target.value)}
                placeholder="0"
                className="w-full rounded-md border border-gray-3 bg-white py-2 pl-3 pr-3 text-dark outline-none focus:border-blue transition disabled:cursor-default disabled:bg-whiter"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="maxPrice"
              className="text-sm text-gray-500 mb-1 block"
            >
              Đến (đ)
            </label>
            <div className="relative">
              <input
                type="text"
                id="maxPrice"
                value={formatCurrency(tempMax)}
                onChange={(e) => handleInputChange("max", e.target.value)}
                placeholder="Ví dụ: 10.000.000"
                className="w-full rounded-md border border-gray-3 bg-white py-2 pl-3 pr-3 text-dark outline-none focus:border-blue transition disabled:cursor-default disabled:bg-whiter"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleApplyFilter}
            className="w-full mt-2 cursor-pointer rounded-md bg-blue py-2 px-4 text-center font-medium text-white hover:bg-opacity-90 transition"
          >
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
};

export default PriceDropdown;
