import { db } from '../db/index.js';
import { addressRefBarangays } from '../db/tables/common.js';

const barangays = [
    { name: 'Bagbaguin', zipCode: '3020' },
    { name: 'Bahay Pare', zipCode: '3020' },
    { name: 'Bancal', zipCode: '3020' },
    { name: 'Banga', zipCode: '3020' },
    { name: 'Bayugo', zipCode: '3020' },
    { name: 'Caingin', zipCode: '3020' },
    { name: 'Calvario', zipCode: '3020' },
    { name: 'Camalig', zipCode: '3020' },
    { name: 'Hulo', zipCode: '3020' },
    { name: 'Iba', zipCode: '3020' },
    { name: 'Langka', zipCode: '3020' },
    { name: 'Lawa', zipCode: '3020' },
    { name: 'Libtong', zipCode: '3020' },
    { name: 'Liputan', zipCode: '3020' },
    { name: 'Longos', zipCode: '3020' },
    { name: 'Malhacan', zipCode: '3020' },
    { name: 'Pajo', zipCode: '3020' },
    { name: 'Pandayan', zipCode: '3020' },
    { name: 'Pantoc', zipCode: '3020' },
    { name: 'Perez', zipCode: '3020' },
    { name: 'Poblacion', zipCode: '3020' },
    { name: 'Saluysoy', zipCode: '3020' },
    { name: 'Saint Francis', zipCode: '3020' }, // Gasak
    { name: 'Tugatog', zipCode: '3020' },
    { name: 'Ubihan', zipCode: '3020' },
    { name: 'Zamora', zipCode: '3020' }
];

async function main() {
    console.log('Seeding Barangays...');

    for (const b of barangays) {
        await db.insert(addressRefBarangays)
            .values(b)
            .onDuplicateKeyUpdate({ set: { zipCode: b.zipCode } });
    }

    console.log('Barangays seeded successfully.');
    process.exit(0);
}

main().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
