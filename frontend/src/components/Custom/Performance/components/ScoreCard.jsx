/**
 * ScoreCard Component
 * Displays the final numerical rating with adjectival rating
 */

import { getAdjectivalRating } from '../constants/performanceConstants';

const ScoreCard = ({ score }) => {
  const ratingInfo = getAdjectivalRating(score);

  return (
    <div className="bg-gradient-to-br from-gray-800 to-slate-800 rounded-xl shadow-lg text-white p-8 flex flex-col justify-center items-center text-center">
      <h3 className="text-gray-200 text-sm font-bold uppercase tracking-widest mb-2">
        Final Numerical Rating
      </h3>
      <div className="text-6xl font-bold mb-2">{score}</div>
      <div className="text-xl font-medium px-4 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
        {ratingInfo.rating}
      </div>
      <p className="text-xs text-gray-300 mt-6 max-w-xs leading-relaxed">
        This score represents the weighted average of all performance criteria assessed in this period.
      </p>
    </div>
  );
};

export default ScoreCard;
