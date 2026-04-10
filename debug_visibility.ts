import axios from 'axios';

async function debugEmployees() {
    try {
        const response = await axios.get('http://localhost:5000/api/employees', {
            headers: {
                // I'll need a token here. I'll assume I can run it if I bypass auth for testing or if I have a valid token.
                // Since I'm on the same machine, maybe I can use a script to login first.
            }
        });
        console.log('Employees Count:', response.data.employees.length);
        const roles = response.data.employees.reduce((acc: any, emp: any) => {
            acc[emp.role] = (acc[emp.role] || 0) + 1;
            return acc;
        }, {});
        console.log('Roles:', roles);
        
        const missingFields = response.data.employees.filter((emp: any) => !emp.firstName || !emp.lastName || !emp.role);
        console.log('Employees with missing critical fields:', missingFields.length);
        
        if (missingFields.length > 0) {
            console.log('Sample missing fields employee:', JSON.stringify(missingFields[0], null, 2));
        }

        const newlyHired = response.data.employees.filter((emp: any) => emp.employmentStatus === 'Probationary' || emp.employmentStatus === 'Active');
        console.log('Newly hired/Probationary count:', newlyHired.length);

    } catch (error: any) {
        console.error('Error fetching employees:', error.response?.data || error.message);
    }
}

// I'll use the UserService directly to avoid auth issues in this script
import { UserService } from './backend/services/user.service';
import { db } from './backend/db/index';

async function debugDirectly() {
    try {
        const employees = await UserService.getAllEmployees();
        console.log('Total Employees from DB:', employees.length);
        
        const roles = employees.reduce((acc: any, emp: any) => {
            acc[emp.role] = (acc[emp.role] || 0) + 1;
            return acc;
        }, {});
        console.log('DB Roles:', roles);

        const departmentMismatches = employees.filter(emp => emp.departmentId && !emp.department);
        console.log('Department ID without Department Name:', departmentMismatches.length);
        
        const hrDetailsMismatches = employees.filter(emp => !emp.employmentStatus);
        console.log('Employees without HR Details:', hrDetailsMismatches.length);

        if (hrDetailsMismatches.length > 0) {
            console.log('Sample employee without HR details:', JSON.stringify(hrDetailsMismatches[0], null, 2));
        }
        
    } catch (error) {
        console.error('Error in direct debug:', error);
    } finally {
        // process.exit(0);
    }
}

debugDirectly();
