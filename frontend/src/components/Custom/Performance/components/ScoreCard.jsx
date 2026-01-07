/**
 * ScoreCard Component
 * Displays the final numerical rating with adjectival rating
 */

import { getAdjectivalRating } from '../constants/performanceConstants';

const ScoreCard = ({ score }) => {
  const ratingInfo = getAdjectivalRating(score);

  return (
    <div className="bg-white rounded-sm shadow-sm border border-gray-100 p-8 flex flex-col justify-center items-center text-center relative overflow-hidden group aspect-square">
      <div className="relative z-10">
        <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-4">
          FINAL NUMERICAL RATING
        </h3>
        <div className="text-6xl font-black text-gray-800 mb-3">{score}</div>
        <div className="inline-block px-4 py-1.5 rounded-sm bg-blue-50 text-blue-700 text-sm font-bold border border-blue-100 shadow-sm">
          {ratingInfo.rating}
        </div>
        <p className="text-[11px] text-gray-400 mt-6 max-w-xs leading-relaxed font-medium">
          Weighted average of all performance criteria assessed in this period.
        </p>
      </div>
    </div>
  );
};

export default ScoreCard;
