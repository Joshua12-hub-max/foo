import React from 'react';
import { Calendar } from "lucide-react";

const Filters = ({ filters, searchQuery, uniqueDepartments, uniqueEmployees, filteredDataCount, isLoading, onFilterChange, onSearchChange, onApply, onClear,}) => (
  <div>
    {/* Advanced Filters Grid */}
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6 items-start bg-white p-4 rounded-lg shadow-md">
      {/* Department Filter */}
      <div className="md:col-span-1">
        <select
          value={filters.department}
          onChange={(e) => onFilterChange("department", e.target.value)}
          disabled={isLoading}
          className="w-full bg-white border border-gray-300 rounded-lg shadow-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all disabled:opacity-50"
          aria-label="Filter by department"
        >
          <option value="">Department</option>
          {uniqueDepartments.map((dept) => (
            <option key={`dept-${dept}`} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {/* Employee Name Filter */}
      <div className="md:col-span-1">
        <select
          value={filters.employee}
          onChange={(e) => onFilterChange("employee", e.target.value)}
          disabled={isLoading}
          className="w-full bg-white border border-gray-300 rounded-lg shadow-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all disabled:opacity-50"
          aria-label="Filter by employee"
        >
          <option value="">Employee</option>
          {uniqueEmployees.map((emp) => (
            <option key={`emp-${emp}`} value={emp}>{emp}</option>
          ))}
        </select>
      </div>

      {/* From Date Filter */}
      <div className="relative md:col-span-1">
        <input
          type="date"
          value={filters.fromDateTime}
          onChange={(e) => onFilterChange("fromDateTime", e.target.value)}
          disabled={isLoading}
          className="w-full px-3 bg-white border border-gray-200 rounded-lg shadow-sm py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer"
          aria-label="From date"
        />
      </div>

      {/* To Date Filter */}
      <div className="relative md:col-span-1">
        <input
          type="date"
          value={filters.toDateTime}
          onChange={(e) => onFilterChange("toDateTime", e.target.value)}
          disabled={isLoading}
          className="w-full px-3 bg-white border border-gray-200 rounded-lg shadow-sm py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer"
          aria-label="To date"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 md:col-span-2">
        <button
          onClick={onApply}
          disabled={isLoading}
          className="flex-1 bg-[#F8F9FA] border border-gray-200 text-gray-700 font-medium px-6 py-2 rounded-lg text-sm shadow-sm hover:bg-[#F8F9FA] transition-all disabled:opacity-50 active:scale-95 whitespace-nowrap"
          aria-label="Apply filters"
        >
          Apply
        </button>
        <button
          onClick={onClear}
          disabled={isLoading}
          className="flex-1 bg-[#F8F9FA] border border-gray-200 text-gray-700 font-medium px-6 py-2 rounded-lg text-sm shadow-sm hover:bg-[#F8F9FA] transition-all disabled:opacity-50 active:scale-95"
          aria-label="Clear filters"
        >
          Clear
        </button>
      </div>
    </div>

    {/* Search Bar */}
    <div className="flex justify-between items-center mb-6">
      <div className="relative w-80">
        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16.65 16.65A7 7 0 1110 3a7 7 0 016.65 13.65z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search by name, ID, or department..."
          disabled={isLoading}
          className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-md shadow-sm w-full text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-all disabled:opacity-50"
          aria-label="Search employees"
        />
      </div>

      {searchQuery && (
        <div className="text-sm text-gray-600">
          Found <span className="font-semibold text-gray-800 mx-1">{filteredDataCount}</span> result{filteredDataCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  </div>
);

export default Filters;