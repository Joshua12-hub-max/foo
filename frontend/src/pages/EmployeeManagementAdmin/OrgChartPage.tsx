import React, { useEffect, useState } from 'react';
import { Network, Building2, User, Users, ChevronDown, ChevronRight, Search, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { getPositions } from '@/api/plantillaApi';
import { type Position } from '@/api/plantillaApi';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface DepartmentNode {
  id: number;
  name: string;
  head?: Position;
  positions: Position[];
  children?: DepartmentNode[];
}

const OrgChartPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<DepartmentNode[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [zoom, setZoom] = useState(1);
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await getPositions({}); 
      if (data.success) {
        setPositions(data.positions);
        processDepartments(data.positions);
      }
    } catch (error) {
      console.error('Failed to fetch org chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processDepartments = (allPositions: Position[]) => {
    // Group by department
    const deptMap = new Map<string, Position[]>();
    allPositions.forEach(pos => {
      const dept = pos.department || 'Unassigned';
      if (!deptMap.has(dept)) {
        deptMap.set(dept, []);
      }
      deptMap.get(dept)?.push(pos);
    });

    // Create Department Nodes
    const deptNodes: DepartmentNode[] = Array.from(deptMap.entries()).map(([name, posts], index) => {
      // Find highest ranking position (highest SG) to assume as Head if not explicit
      // Sort by SG desc, Step desc, Item No asc
      const sorted = [...posts].sort((a, b) => b.salaryGrade - a.salaryGrade || b.stepIncrement - a.stepIncrement);
      
      return {
        id: index,
        name,
        head: sorted[0], // Highest SG is likely the head
        positions: sorted.slice(1) // rest
      };
    });

    setDepartments(deptNodes);
    // Expand all by default
    const initialExpanded = deptNodes.reduce((acc, dept) => ({ ...acc, [dept.name]: true }), {});
    setExpandedDepts(initialExpanded);
  };

  const toggleDept = (name: string) => {
    setExpandedDepts(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.head?.positionTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.head?.incumbentName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <Network className="text-blue-600" size={32} />
            Organizational Chart
          </h1>
          <p className="text-gray-500 mt-1">Visual hierarchy of departments and positions.</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
             <input 
               type="text" 
               placeholder="Search department or person..." 
               className="pl-9 pr-4 py-2 bg-transparent outline-none text-sm w-64"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           <div className="h-6 w-px bg-gray-200 mx-1"></div>
           <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} className="p-2 hover:bg-gray-100 rounded text-gray-500"><ZoomOut size={16} /></button>
           <span className="text-xs font-mono w-12 text-center text-gray-400">{Math.round(zoom * 100)}%</span>
           <button onClick={() => setZoom(Math.min(1.5, zoom + 0.1))} className="p-2 hover:bg-gray-100 rounded text-gray-500"><ZoomIn size={16} /></button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="overflow-auto border border-gray-200 rounded-xl bg-white shadow-inner p-8 relative min-h-[600px]">
          
          <div 
            className="transition-transform origin-top-left"
            style={{ transform: `scale(${zoom})`, width: `${filteredDepartments.length * 320}px` }} 
          >
            <div className="flex flex-wrap items-start justify-center gap-8">
              {filteredDepartments.map((dept) => (
                <DepartmentCard 
                  key={dept.name} 
                  dept={dept} 
                  expanded={!!expandedDepts[dept.name]} 
                  onToggle={() => toggleDept(dept.name)}
                />
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

const DepartmentCard: React.FC<{ dept: DepartmentNode; expanded: boolean; onToggle: () => void }> = ({ dept, expanded, onToggle }) => {
  return (
    <motion.div 
      layout
      className="w-80 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden flex flex-col"
    >
      {/* Head of Office (Header) */}
      <div 
        className="bg-gradient-to-br from-blue-900 to-blue-800 p-4 text-white cursor-pointer relative"
        onClick={onToggle}
      >
        <div className="absolute top-4 right-4 text-blue-200">
           {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
        <div className="flex items-center gap-2 text-blue-200 mb-2">
           <Building2 size={14} />
           <span className="text-xs font-bold tracking-wider">{dept.name}</span>
        </div>
        
        {/* Head Profile */}
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-blue-700/50 flex items-center justify-center border border-blue-500/30">
              <User size={20} className="text-blue-100" />
           </div>
           <div>
              <p className="font-bold text-sm leading-tight">{dept.head?.incumbentName || 'Vacant'}</p>
              <p className="text-[10px] text-blue-200 font-medium">{dept.head?.positionTitle || 'Head of Office'}</p>
              <span className="inline-block mt-1 px-1.5 py-0.5 bg-blue-950/50 rounded text-[9px] text-blue-300">
                 SG {dept.head?.salaryGrade}
              </span>
           </div>
        </div>
      </div>

      {/* Staff List */}
      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gray-50 border-t border-gray-100"
          >
            <div className="p-2 flex items-center justify-between bg-gray-100/50 border-b border-gray-200 px-4">
               <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                 <Users size={10} /> Workforce
               </span>
               <span className="text-[10px] font-bold text-gray-500 bg-gray-200 px-1.5 rounded-full">{dept.positions.length}</span>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin">
              {dept.positions.map((pos) => (
                <div key={pos.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-100 group">
                   <div className={`w-2 h-2 rounded-full ${pos.isVacant ? 'bg-amber-400' : 'bg-green-500'}`}></div>
                   <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${pos.isVacant ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                        {pos.incumbentName || 'Vacant'}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">{pos.positionTitle}</p>
                   </div>
                   <div className="text-[9px] text-gray-400 font-mono bg-gray-100 px-1 rounded opacity-50 group-hover:opacity-100">
                      SG{pos.salaryGrade}
                   </div>
                </div>
              ))}
              {dept.positions.length === 0 && (
                <div className="text-center py-4 text-xs text-gray-400 italic">No additional staff</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OrgChartPage;
