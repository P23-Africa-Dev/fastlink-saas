<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeds Nigeria (and a handful of common countries) with their states and LGAs.
 *
 * Run standalone:
 *   php artisan db:seed --class=LocationSeeder
 *
 * Safe to re-run — uses upsert so no duplicates are created.
 */
class LocationSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedCountriesAndStates();
        $this->seedNigeriaLgas();
    }

    // -------------------------------------------------------------------------
    // Countries + states
    // -------------------------------------------------------------------------

    private function seedCountriesAndStates(): void
    {
        $data = $this->locationData();

        foreach ($data as $countryData) {
            DB::table('countries')->upsert(
                [['name' => $countryData['name'], 'code' => $countryData['code'], 'created_at' => now(), 'updated_at' => now()]],
                ['code'],
                ['name', 'updated_at']
            );

            $countryId = DB::table('countries')->where('code', $countryData['code'])->value('id');

            if (empty($countryData['states'])) {
                continue;
            }

            $stateRows = array_map(fn(string $name) => [
                'country_id' => $countryId,
                'name'       => $name,
                'created_at' => now(),
                'updated_at' => now(),
            ], $countryData['states']);

            // Upsert on (country_id, name) — no duplicates
            foreach ($stateRows as $row) {
                DB::table('states')->upsert(
                    [$row],
                    ['country_id', 'name'],
                    ['updated_at']
                );
            }
        }
    }

    // -------------------------------------------------------------------------
    // Nigeria LGAs
    // -------------------------------------------------------------------------

    private function seedNigeriaLgas(): void
    {
        $nigeriaId = DB::table('countries')->where('code', 'NG')->value('id');
        if (!$nigeriaId) {
            return;
        }

        foreach ($this->nigeriaLgas() as $stateName => $lgas) {
            $stateId = DB::table('states')
                ->where('country_id', $nigeriaId)
                ->whereRaw('LOWER(name) = ?', [strtolower($stateName)])
                ->value('id');

            if (!$stateId) {
                continue;
            }

            $rows = array_map(fn(string $lga) => [
                'state_id'   => $stateId,
                'name'       => $lga,
                'created_at' => now(),
                'updated_at' => now(),
            ], $lgas);

            foreach ($rows as $row) {
                DB::table('lgas')->upsert(
                    [$row],
                    ['state_id', 'name'],
                    ['updated_at']
                );
            }
        }
    }

    // -------------------------------------------------------------------------
    // Data
    // -------------------------------------------------------------------------

    /** @return array<int, array{name: string, code: string, states: string[]}> */
    private function locationData(): array
    {
        return [
            [
                'name'   => 'Nigeria',
                'code'   => 'NG',
                'states' => [
                    'Abia',
                    'Adamawa',
                    'Akwa Ibom',
                    'Anambra',
                    'Bauchi',
                    'Bayelsa',
                    'Benue',
                    'Borno',
                    'Cross River',
                    'Delta',
                    'Ebonyi',
                    'Edo',
                    'Ekiti',
                    'Enugu',
                    'FCT - Abuja',
                    'Gombe',
                    'Imo',
                    'Jigawa',
                    'Kaduna',
                    'Kano',
                    'Katsina',
                    'Kebbi',
                    'Kogi',
                    'Kwara',
                    'Lagos',
                    'Nasarawa',
                    'Niger',
                    'Ogun',
                    'Ondo',
                    'Osun',
                    'Oyo',
                    'Plateau',
                    'Rivers',
                    'Sokoto',
                    'Taraba',
                    'Yobe',
                    'Zamfara',
                ],
            ],
            ['name' => 'Ghana',          'code' => 'GH', 'states' => ['Ashanti', 'Brong-Ahafo', 'Central', 'Eastern', 'Greater Accra', 'Northern', 'Upper East', 'Upper West', 'Volta', 'Western']],
            ['name' => 'Kenya',          'code' => 'KE', 'states' => ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale']],
            ['name' => 'South Africa',   'code' => 'ZA', 'states' => ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape']],
            ['name' => 'United Kingdom', 'code' => 'GB', 'states' => ['England', 'Scotland', 'Wales', 'Northern Ireland']],
            ['name' => 'United States',  'code' => 'US', 'states' => ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming']],
            ['name' => 'Canada',         'code' => 'CA', 'states' => ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan']],
            ['name' => 'India',          'code' => 'IN', 'states' => ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal']],
            ['name' => 'Australia',      'code' => 'AU', 'states' => ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania', 'ACT', 'Northern Territory']],
            ['name' => 'Germany',        'code' => 'DE', 'states' => ['Bavaria', 'Berlin', 'Hamburg', 'North Rhine-Westphalia', 'Baden-Württemberg', 'Hesse', 'Saxony', 'Brandenburg', 'Thuringia', 'Rhineland-Palatinate']],
        ];
    }

    /** @return array<string, string[]> */
    private function nigeriaLgas(): array
    {
        return [
            'Lagos' => [
                'Agege',
                'Ajeromi-Ifelodun',
                'Alimosho',
                'Amuwo-Odofin',
                'Apapa',
                'Badagry',
                'Epe',
                'Eti-Osa',
                'Ibeju-Lekki',
                'Ifako-Ijaiye',
                'Ikeja',
                'Ikorodu',
                'Kosofe',
                'Lagos Island',
                'Lagos Mainland',
                'Mushin',
                'Ojo',
                'Oshodi-Isolo',
                'Shomolu',
                'Surulere',
            ],
            'Abuja' => [
                'Abaji',
                'Bwari',
                'Gwagwalada',
                'Kuje',
                'Kwali',
                'Municipal Area Council',
            ],
            'FCT - Abuja' => [
                'Abaji',
                'Bwari',
                'Gwagwalada',
                'Kuje',
                'Kwali',
                'Municipal Area Council',
            ],
            'Kano' => [
                'Ajingi',
                'Albasu',
                'Bagwai',
                'Bebeji',
                'Bichi',
                'Bunkure',
                'Dala',
                'Dambatta',
                'Dawakin Kudu',
                'Dawakin Tofa',
                'Doguwa',
                'Fagge',
                'Gabasawa',
                'Garko',
                'Garun Mallam',
                'Gaya',
                'Gezawa',
                'Gwale',
                'Gwarzo',
                'Kabo',
                'Kano Municipal',
                'Karaye',
                'Kibiya',
                'Kiru',
                'Kumbotso',
                'Kunchi',
                'Kura',
                'Madobi',
                'Makoda',
                'Minjibir',
                'Nasarawa',
                'Rano',
                'Rimin Gado',
                'Rogo',
                'Shanono',
                'Sumaila',
                'Takai',
                'Tarauni',
                'Tofa',
                'Tsanyawa',
                'Tudun Wada',
                'Ungogo',
                'Warawa',
                'Wudil',
            ],
            'Rivers' => [
                'Abua-Odual',
                'Ahoada East',
                'Ahoada West',
                'Akuku-Toru',
                'Andoni',
                'Asari-Toru',
                'Bonny',
                'Degema',
                'Eleme',
                'Emuoha',
                'Etche',
                'Gokana',
                'Ikwerre',
                'Khana',
                'Obio-Akpor',
                'Ogba-Egbema-Ndoni',
                'Ogu-Bolo',
                'Okrika',
                'Omuma',
                'Opobo-Nkoro',
                'Oyigbo',
                'Port Harcourt',
                'Tai',
            ],
            'Ogun' => [
                'Abeokuta North',
                'Abeokuta South',
                'Ado-Odo/Ota',
                'Egbado North',
                'Egbado South',
                'Ewekoro',
                'Ifo',
                'Ijebu East',
                'Ijebu North',
                'Ijebu North East',
                'Ijebu Ode',
                'Ikenne',
                'Imeko Afon',
                'Ipokia',
                'Obafemi Owode',
                'Odeda',
                'Odogbolu',
                'Ogun Waterside',
                'Remo North',
                'Sagamu',
            ],
            'Oyo' => [
                'Afijio',
                'Akinyele',
                'Atiba',
                'Atisbo',
                'Egbeda',
                'Ibadan North',
                'Ibadan North-East',
                'Ibadan North-West',
                'Ibadan South-East',
                'Ibadan South-West',
                'Ibarapa Central',
                'Ibarapa East',
                'Ibarapa North',
                'Ido',
                'Irepo',
                'Iseyin',
                'Itesiwaju',
                'Iwajowa',
                'Kajola',
                'Lagelu',
                'Ogbomosho North',
                'Ogbomosho South',
                'Ogo Oluwa',
                'Olorunsogo',
                'Oluyole',
                'Ona Ara',
                'Orelope',
                'Ori Ire',
                'Oyo East',
                'Oyo West',
                'Saki East',
                'Saki West',
                'Surulere',
            ],
            'Anambra' => [
                'Aguata',
                'Anambra East',
                'Anambra West',
                'Anaocha',
                'Awka North',
                'Awka South',
                'Ayamelum',
                'Dunukofia',
                'Ekwusigo',
                'Idemili North',
                'Idemili South',
                'Ihiala',
                'Njikoka',
                'Nnewi North',
                'Nnewi South',
                'Ogbaru',
                'Onitsha North',
                'Onitsha South',
                'Orumba North',
                'Orumba South',
                'Oyi',
            ],
            'Delta' => [
                'Aniocha North',
                'Aniocha South',
                'Bomadi',
                'Burutu',
                'Ethiope East',
                'Ethiope West',
                'Ika North East',
                'Ika South',
                'Isoko North',
                'Isoko South',
                'Ndokwa East',
                'Ndokwa West',
                'Okpe',
                'Oshimili North',
                'Oshimili South',
                'Patani',
                'Sapele',
                'Udu',
                'Ughelli North',
                'Ughelli South',
                'Ukwuani',
                'Uvwie',
                'Warri North',
                'Warri South',
                'Warri South West',
            ],
            'Enugu' => [
                'Aninri',
                'Awgu',
                'Enugu East',
                'Enugu North',
                'Enugu South',
                'Ezeagu',
                'Igbo Etiti',
                'Igbo Eze North',
                'Igbo Eze South',
                'Isi Uzo',
                'Nkanu East',
                'Nkanu West',
                'Nsukka',
                'Oji River',
                'Udenu',
                'Udi',
                'Uzo Uwani',
            ],
            'Imo' => [
                'Aboh Mbaise',
                'Ahiazu Mbaise',
                'Ehime Mbano',
                'Ezinihitte',
                'Ideato North',
                'Ideato South',
                'Ihitte/Uboma',
                'Ikeduru',
                'Isiala Mbano',
                'Isu',
                'Mbaitoli',
                'Ngor Okpala',
                'Njaba',
                'Nkwerre',
                'Nwangele',
                'Obowo',
                'Oguta',
                'Ohaji-Egbema',
                'Okigwe',
                'Onuimo',
                'Orlu',
                'Orsu',
                'Oru East',
                'Oru West',
                'Owerri Municipal',
                'Owerri North',
                'Owerri West',
            ],
            'Kaduna' => [
                'Birnin Gwari',
                'Chikun',
                'Giwa',
                'Igabi',
                'Ikara',
                'Jaba',
                "Jema'a",
                'Kachia',
                'Kaduna North',
                'Kaduna South',
                'Kagarko',
                'Kajuru',
                'Kaura',
                'Kauru',
                'Kubau',
                'Kudan',
                'Lere',
                'Makarfi',
                'Sabon Gari',
                'Sanga',
                'Soba',
                'Zangon Kataf',
                'Zaria',
            ],
            'Cross River' => [
                'Abi',
                'Akamkpa',
                'Akpabuyo',
                'Bakassi',
                'Bekwarra',
                'Biase',
                'Boki',
                'Calabar Municipal',
                'Calabar South',
                'Etung',
                'Ikom',
                'Obanliku',
                'Obubra',
                'Obudu',
                'Odukpani',
                'Ogoja',
                'Yakurr',
                'Yala',
            ],
            'Edo' => [
                'Akoko-Edo',
                'Egor',
                'Esan Central',
                'Esan North-East',
                'Esan South-East',
                'Esan West',
                'Etsako Central',
                'Etsako East',
                'Etsako West',
                'Igueben',
                'Ikpoba-Okha',
                'Orhionmwon',
                'Oredo',
                'Ovia North-East',
                'Ovia South-West',
                'Owan East',
                'Owan West',
                'Uhunmwonde',
            ],
            'Abia' => [
                'Aba North',
                'Aba South',
                'Arochukwu',
                'Bende',
                'Ikwuano',
                'Isiala Ngwa North',
                'Isiala Ngwa South',
                'Isuikwuato',
                'Obingwa',
                'Ohafia',
                'Osisioma Ngwa',
                'Ugwunagbo',
                'Ukwa East',
                'Ukwa West',
                'Umuahia North',
                'Umuahia South',
                'Umu Nneochi',
            ],
            'Benue' => [
                'Ado',
                'Agatu',
                'Apa',
                'Buruku',
                'Gboko',
                'Guma',
                'Gwer East',
                'Gwer West',
                'Katsina-Ala',
                'Konshisha',
                'Kwande',
                'Logo',
                'Makurdi',
                'Obi',
                'Ogbadibo',
                'Ohimini',
                'Oju',
                'Okpokwu',
                'Otukpo',
                'Tarka',
                'Ukum',
                'Ushongo',
                'Vandeikya',
            ],
            'Plateau' => [
                'Barkin Ladi',
                'Bassa',
                'Bokkos',
                'Jos East',
                'Jos North',
                'Jos South',
                'Kanam',
                'Kanke',
                'Langtang North',
                'Langtang South',
                'Mangu',
                'Mikang',
                'Pankshin',
                "Qua'an Pan",
                'Riyom',
                'Shendam',
                'Wase',
            ],
        ];
    }
}
