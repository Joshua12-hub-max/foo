import React from 'react';
import { Calendar } from "lucide-react";

const Filters = ({ filters, searchQuery, filteredDataCount, isLoading, onFilterChange, onSearchChange, onApply, onClear }) => (
  <div>
    {/* Simplified Filters Grid - Date Range Only */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 items-start bg-white p-4 rounded-lg shadow-md">
      {/* From Date Filter */}
      <div className="relative md:col-span-1">
        <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
        <input
          type="date"
          value={filters.fromDateTime}
          onChange={(e) => onFilterChange("fromDateTime", e.target.value)}
          disabled={isLoading}
          className="w-full pl-10 bg-white border border-gray-300 rounded-lg shadow-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all disabled:opacity-50"
          aria-label="From date"
        />
      </div>

      {/* To Date Filter */}
      <div className="relative md:col-span-1">
        <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
        <input
          type="date"
          value={filters.toDateTime}
          onChange={(e) => onFilterChange("toDateTime", e.target.value)}
          disabled={isLoading}
          className="w-full pl-10 bg-white border border-gray-300 rounded-lg shadow-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all disabled:opacity-50"
          aria-label="To date"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 md:col-span-2">
        <button
          onClick={onApply}
          disabled={isLoading}
          className="flex-1 bg-white border border-gray-300 text-gray-800 font-semibold px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Apply filters"
        >
          Apply
        </button>
        <button
          onClick={onClear}
          disabled={isLoading}
          className="flex-1 bg-white border border-gray-300 text-gray-800 font-semibold px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
          placeholder="Search schedule..."
          disabled={isLoading}
          className="w-full pl-10 bg-white border border-gray-300 rounded-lg shadow-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all disabled:opacity-50"
          aria-label="Search schedule"
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
