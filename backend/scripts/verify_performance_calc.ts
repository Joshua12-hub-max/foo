

// Mocking the logic from performanceController.ts
async function verifyCalculationLogic() {
    console.log('--- Verifying Performance Calculation Logic ---');

    // 1. Simulating Data
    // Item 1: Template Weight 20, Custom Weight 30. Score 5.
    // Logic SHOULD use 30. 
    // Current Logic uses Template (20).
    const items = [
        {
            id: 1,
            score: 5,
            itemWeight: 30, // Custom override
            criteriaWeight: 20 // Template default
        },
        {
            id: 2,
            score: 4,
            itemWeight: 10,
            criteriaWeight: 10 // Same
        }
    ];

    console.log('Test Case 1: Custom Weight Override');
    console.log('Item 1: Score 5, Template Weight 20, Custom Weight 30');
    console.log('Item 2: Score 4, Template Weight 10, Custom Weight 10');

    // Current Implementation Logic (Replicated)
    let totalWeightedScore_Current = 0;
    let totalWeight_Current = 0;

    items.forEach(item => {
        // CURRENT BUGGY ORDER: criteria || item
        const weight = parseFloat(String(item.criteriaWeight || item.itemWeight || 1));
        const score = parseFloat(String(item.score)) || 0;
        
        console.log(`   [Current Logic] Item ${item.id} using Weight: ${weight}`);
        totalWeightedScore_Current += score * weight;
        totalWeight_Current += weight;
    });

    const currentScore = totalWeight_Current > 0 ? (totalWeightedScore_Current / totalWeight_Current).toFixed(2) : '0';
    console.log(`   -> Current Calculated Score: ${currentScore} (Total Weight: ${totalWeight_Current})`);


    // Proposed Fix Logic
    let totalWeightedScore_Fixed = 0;
    let totalWeight_Fixed = 0;

    items.forEach(item => {
        // FIXED ORDER: item || criteria
        const weight = parseFloat(String(item.itemWeight || item.criteriaWeight || 1));
        const score = parseFloat(String(item.score)) || 0;
        
        console.log(`   [Fixed Logic] Item ${item.id} using Weight: ${weight}`);
        totalWeightedScore_Fixed += score * weight;
        totalWeight_Fixed += weight;
    });

    const fixedScore = totalWeight_Fixed > 0 ? (totalWeightedScore_Fixed / totalWeight_Fixed).toFixed(2) : '0';
    console.log(`   -> Fixed Calculated Score: ${fixedScore} (Total Weight: ${totalWeight_Fixed})`);

    // Expected:
    // With Current (Weights 20, 10): (5*20 + 4*10) / 30 = 140 / 30 = 4.67
    // With Fixed (Weights 30, 10): (5*30 + 4*10) / 40 = 190 / 40 = 4.75
    
    if (currentScore !== fixedScore) {
        console.log('\n[CONCLUSION] Logic difference detected. "Current" logic ignores custom weights if template exists.');
    } else {
        console.log('\n[CONCLUSION] No difference? Check inputs.');
    }

}

verifyCalculationLogic();
