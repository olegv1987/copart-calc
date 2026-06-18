// ============================================================
// data.js — freight rates parsed from Copart auction yards
// Source: TruckingAndOceanFreightQuotes.csv (Copart rows only)
// Destination port: Klaipeda. All prices in USD.
// ============================================================

// Vehicle cargo types supported in this version.
const CARGO_TYPES = [
  { id: "regular",  label: "Regular Car" },
  { id: "large",    label: "Large Car" },
  { id: "oversize", label: "Oversize Car" },
];

// Sorted list of auction yard names ("CITY - State").
const YARDS = [
  "ABILENE - Texas",
  "ADELANTO - California",
  "ADP TOWING MAUI - Hawaii",
  "AKRON - Ohio",
  "ALBANY - New York",
  "ALBUQUERQUE - New Mexico",
  "ALTOONA - Pennsylvania",
  "AMARILLO - Texas",
  "ANDREWS - Texas",
  "ANTELOPE - California",
  "APPLETON - Wisconsin",
  "ATLANTA EAST - Georgia",
  "ATLANTA NORTH - Georgia",
  "ATLANTA SOUTH - Georgia",
  "ATLANTA WEST - Georgia",
  "AUSTIN - Texas",
  "Augusta - Georgia",
  "BAKERSFIELD - California",
  "BALTIMORE - Maryland",
  "BALTIMORE EAST - Maryland",
  "BATON ROUGE - Louisiana",
  "BILLINGS - Montana",
  "BIRMINGHAM - Alabama",
  "BOISE - Idaho",
  "Buffalo - New York",
  "CALGARY - Alberta",
  "CANDIA - New Hampshire",
  "CARTERSVILLE - Georgia",
  "CEDAR RAPIDS - Iowa",
  "CHAMBERSBURG - Pennsylvania",
  "CHARLESTON - West Virginia",
  "CHICAGO NORTH - Illinois",
  "CHICAGO SOUTH - Illinois",
  "CHINA GROVE - North Carolina",
  "CICERO - Indiana",
  "CLEVELAND EAST - Ohio",
  "CLEVELAND WEST - Ohio",
  "CLEWISTON - Florida",
  "COLORADO SPRINGS - Colorado",
  "COLUMBUS - Ohio",
  "CONCORD - North Carolina",
  "CORPUS CHRISTI - Texas",
  "CRASHEDTOYS ATLANTA - Georgia",
  "CRASHEDTOYS DALLAS - Texas",
  "CUSSETA - Alabama",
  "DALLAS - Texas",
  "DALLAS SOUTH - Texas",
  "DANVILLE - Virginia",
  "DAVENPORT - 169 Davenport sublot",
  "DAVENPORT - Iowa",
  "DAYTON - Ohio",
  "DENVER - Colorado",
  "DENVER CENTRAL - Colorado",
  "DENVER SOUTH - Colorado",
  "DES MOINES - Iowa",
  "DETROIT - Michigan",
  "DOTHAN - Alabama",
  "DYER - Indiana",
  "EARLINGTON - Kentucky",
  "EDMONTON - Alberta",
  "EL PASO - Texas",
  "EUGENE - Oregon",
  "EXETER - Rhode Island",
  "FAIRBURN - Georgia",
  "FAYETTEVILLE - Arkansas",
  "FLINT - Michigan",
  "FORT WAYNE - Indiana",
  "FREDERICKSBURG - Virginia",
  "FREETOWN - Massachusetts",
  "FRESNO - California",
  "FT. PIERCE - Florida",
  "FT. WORTH - Texas",
  "GASTONIA - North Carolina",
  "GLASSBORO EAST - New Jersey",
  "GLASSBORO WEST - New Jersey",
  "GRAHAM - Washington",
  "Grenada - Mississippi",
  "HALIFAX - Nova Scotia",
  "HAMPTON - Virginia",
  "HARRISBURG - Pennsylvania",
  "HARTFORD - Connecticut",
  "HARTFORD SPRINGFIELD - Connecticut",
  "HAYWARD - California",
  "HELENA - Montana",
  "HONOLULU - Hawaii",
  "HOUSTON - Texas",
  "HOUSTON EAST - Texas",
  "INDIANAPOLIS - Indiana",
  "IONIA - Michigan",
  "JACKSON - Mississippi",
  "JACKSONVILLE EAST - Florida",
  "JACKSONVILLE NORTH - Florida",
  "JACKSONVILLE WEST - Florida",
  "KANSAS CITY - Kansas",
  "KENS TOWING HILO - Hawaii",
  "KINCHELOE - Michigan",
  "KINDAQUICK TOWING LLC - Hawaii",
  "KNOXVILLE - Tennessee",
  "LAGRANGE - North Carolina",
  "LANSING - Michigan",
  "LAS VEGAS - Nevada",
  "LAS VEGAS WEST - Nevada",
  "LEXINGTON EAST - Kentucky",
  "LEXINGTON WEST - Kentucky",
  "LINCOLN - Nebraska",
  "LITTLE ROCK - Arkansas",
  "LONDON - Ontario",
  "LONG BEACH - California",
  "LONG ISLAND - New York",
  "LONGVIEW - Texas",
  "LOS ANGELES - California",
  "LOUISVILLE - Kentucky",
  "LUFKIN - Texas",
  "LUMBERTON - North Carolina",
  "LYMAN - Maine",
  "MACON - Georgia",
  "MADISON - Wisconsin",
  "MADISON SOUTH - Wisconsin",
  "MARTINEZ - California",
  "MCALLEN - Texas",
  "MEBANE - North Carolina",
  "MEMPHIS - Tennessee",
  "MENTONE - California",
  "MIAMI CENTRAL - Florida",
  "MIAMI NORTH - Florida",
  "MIAMI SOUTH - Florida",
  "MILWAUKEE - Wisconsin",
  "MILWAUKEE NORTH - Wisconsin",
  "MILWAUKEE SOUTH - Wisconsin",
  "MINNEAPOLIS - Minnesota",
  "MINNEAPOLIS NORTH - Minnesota",
  "MO - COLUMBIA",
  "MOBILE - Alabama",
  "MOBILE SOUTH - Alabama",
  "MOCKSVILLE - North Carolina",
  "MONCTON - New Brunswick",
  "MONTGOMERY - Alabama",
  "MONTREAL - Quebec",
  "N.Boston-ROWLEY Sublot - Massachusetts",
  "NAPA - California",
  "NASHVILLE - Tennessee",
  "NEW ORLEANS - Louisiana",
  "NEWBURGH - New York",
  "NORTH AUSTIN - Texas",
  "NORTH BOSTON - Massachusetts",
  "NORTH CHARLESTON - South Carolina",
  "NORTH SEATTLE - Washington",
  "OCALA - Florida",
  "OGDEN - Utah",
  "OKLAHOMA CITY - Oklahoma",
  "ORLANDO - Florida",
  "ORLANDO NORTH - Florida",
  "ORLANDO SOUTH - Florida",
  "OTTAWA - Ontario",
  "PASCO - Washington",
  "PEORIA - Illinois",
  "PHILADELPHIA - Pennsylvania",
  "PHILADELPHIA EAST-SUBLOT - Pennsylvania",
  "PHOENIX - Arizona",
  "PITTSBURGH EAST - Pennsylvania",
  "PITTSBURGH NORTH - Pennsylvania",
  "PITTSBURGH SOUTH - Pennsylvania",
  "PITTSBURGH WEST - Pennsylvania",
  "PORTLAND NORTH - Oregon",
  "PORTLAND SOUTH - Oregon",
  "PUNTA GORDA - Florida",
  "PUNTA GORDA SOUTH - Florida",
  "Phoenix North - Arizona",
  "RALEIGH - North Carolina",
  "RALEIGH NORTH - North Carolina",
  "RANCHO CUCAMONGA - California",
  "REDDING - California",
  "RENO - Nevada",
  "RICHMOND - Virginia",
  "RICHMOND EAST - Virginia",
  "ROCHESTER - New York",
  "RUTLAND - Vermont",
  "SACRAMENTO - California",
  "SALT LAKE CITY - Utah",
  "SALT LAKE CITY NORTH - Utah",
  "SAN ANTONIO - Texas",
  "SAN BERNARDINO - California",
  "SAN DIEGO - California",
  "SAN JOSE - California",
  "SAVANNAH - Georgia",
  "SAVANNAH / VERTIA SUBLOT-Georgia Copart - Georgia",
  "SC - COLUMBIA",
  "SCRANTON - Pennsylvania",
  "SEAFORD - Delaware",
  "SHREVEPORT - Louisiana",
  "SIKESTON - Missouri",
  "SO SACRAMENTO - California",
  "SOMERVILLE - New Jersey",
  "SOUTH BOSTON - Massachusetts",
  "SPANAWAY - Washington",
  "SPARTANBURG - South Carolina",
  "SPOKANE - Washington",
  "SPRINGFIELD - Missouri",
  "ST. CLOUD - Minnesota",
  "ST. JOHN'S - Newfoundland and Lab",
  "ST. LOUIS - Missouri",
  "SUN VALLEY - California",
  "SYRACUSE - New York",
  "Southern Illinois - Illinois",
  "TALLAHASSEE - Florida",
  "TAMPA NORTH - Florida",
  "TAMPA SOUTH - Florida",
  "TAMPA SOUTH - Mulberry Sublot",
  "TANNER - Alabama",
  "TIFTON - Georgia",
  "TORONTO - Ontario",
  "TOW GUYS KAMUELA - Hawaii",
  "TRENTON - New Jersey",
  "TUCSON - Arizona",
  "TULSA - Oklahoma",
  "VALLEJO - California",
  "VAN NUYS - California",
  "VINTON - Louisiana",
  "WACO - Texas",
  "WALTON - Kentucky",
  "WASHINGTON DC - Maryland",
  "WAYLAND - Michigan",
  "WEST PALM BEACH - Florida",
  "WEST WARREN - Massachusetts",
  "WHEELING - Illinois",
  "WICHITA - Kansas",
  "Windham - Maine",
  "YORK HAVEN - Pennsylvania"
];

// Freight lookup: FREIGHT[yard][typeId] = { towing, ocean, total }
//   towing — road delivery from yard to US departure port
//   ocean  — ocean freight from US port to Klaipeda
//   total  — combined delivery cost to Klaipeda port
const FREIGHT = {
  "ABILENE - Texas": {
    "regular": {
      "towing": 350.0,
      "ocean": 750.0,
      "total": 1100.0
    },
    "large": {
      "towing": 350.0,
      "ocean": 850.0,
      "total": 1200.0
    },
    "oversize": {
      "towing": 350.0,
      "ocean": 1100.0,
      "total": 1450.0
    }
  },
  "ADELANTO - California": {
    "regular": {
      "towing": 300.0,
      "ocean": 1200.0,
      "total": 1500.0
    },
    "large": {
      "towing": 300.0,
      "ocean": 1450.0,
      "total": 1750.0
    },
    "oversize": {
      "towing": 300.0,
      "ocean": 1700.0,
      "total": 2000.0
    }
  },
  "ADP TOWING MAUI - Hawaii": {
    "regular": {
      "towing": 2250.0,
      "ocean": 1200.0,
      "total": 3450.0
    },
    "large": {
      "towing": 2250.0,
      "ocean": 1450.0,
      "total": 3700.0
    },
    "oversize": {
      "towing": 2250.0,
      "ocean": 1700.0,
      "total": 3950.0
    }
  },
  "AKRON - Ohio": {
    "regular": {
      "towing": 550.0,
      "ocean": 675.0,
      "total": 1225.0
    },
    "large": {
      "towing": 550.0,
      "ocean": 775.0,
      "total": 1325.0
    },
    "oversize": {
      "towing": 550.0,
      "ocean": 1000.0,
      "total": 1550.0
    }
  },
  "ALBANY - New York": {
    "regular": {
      "towing": 275.0,
      "ocean": 700.0,
      "total": 975.0
    },
    "large": {
      "towing": 275.0,
      "ocean": 800.0,
      "total": 1075.0
    },
    "oversize": {
      "towing": 275.0,
      "ocean": 1050.0,
      "total": 1325.0
    }
  },
  "ALBUQUERQUE - New Mexico": {
    "regular": {
      "towing": 600.0,
      "ocean": 750.0,
      "total": 1350.0
    },
    "large": {
      "towing": 600.0,
      "ocean": 850.0,
      "total": 1450.0
    },
    "oversize": {
      "towing": 600.0,
      "ocean": 1100.0,
      "total": 1700.0
    }
  },
  "ALTOONA - Pennsylvania": {
    "regular": {
      "towing": 450.0,
      "ocean": 700.0,
      "total": 1150.0
    },
    "large": {
      "towing": 450.0,
      "ocean": 800.0,
      "total": 1250.0
    },
    "oversize": {
      "towing": 450.0,
      "ocean": 1050.0,
      "total": 1500.0
    }
  },
  "AMARILLO - Texas": {
    "regular": {
      "towing": 525.0,
      "ocean": 750.0,
      "total": 1275.0
    },
    "large": {
      "towing": 525.0,
      "ocean": 850.0,
      "total": 1375.0
    },
    "oversize": {
      "towing": 525.0,
      "ocean": 1100.0,
      "total": 1625.0
    }
  },
  "ANDREWS - Texas": {
    "regular": {
      "towing": 425.0,
      "ocean": 750.0,
      "total": 1175.0
    },
    "large": {
      "towing": 425.0,
      "ocean": 850.0,
      "total": 1275.0
    },
    "oversize": {
      "towing": 425.0,
      "ocean": 1100.0,
      "total": 1525.0
    }
  },
  "ANTELOPE - California": {
    "regular": {
      "towing": 400.0,
      "ocean": 1200.0,
      "total": 1600.0
    },
    "large": {
      "towing": 400.0,
      "ocean": 1450.0,
      "total": 1850.0
    },
    "oversize": {
      "towing": 400.0,
      "ocean": 1700.0,
      "total": 2100.0
    }
  },
  "APPLETON - Wisconsin": {
    "regular": {
      "towing": 325.0,
      "ocean": 850.0,
      "total": 1175.0
    },
    "large": {
      "towing": 325.0,
      "ocean": 950.0,
      "total": 1275.0
    },
    "oversize": {
      "towing": 325.0,
      "ocean": 1250.0,
      "total": 1575.0
    }
  },
  "ATLANTA EAST - Georgia": {
    "regular": {
      "towing": 300.0,
      "ocean": 675.0,
      "total": 975.0
    },
    "large": {
      "towing": 300.0,
      "ocean": 775.0,
      "total": 1075.0
    },
    "oversize": {
      "towing": 300.0,
      "ocean": 1000.0,
      "total": 1300.0
    }
  },
  "ATLANTA NORTH - Georgia": {
    "regular": {
      "towing": 325.0,
      "ocean": 675.0,
      "total": 1000.0
    },
    "large": {
      "towing": 325.0,
      "ocean": 775.0,
      "total": 1100.0
    },
    "oversize": {
      "towing": 325.0,
      "ocean": 1000.0,
      "total": 1325.0
    }
  },
  "ATLANTA SOUTH - Georgia": {
    "regular": {
      "towing": 300.0,
      "ocean": 675.0,
      "total": 975.0
    },
    "large": {
      "towing": 300.0,
      "ocean": 775.0,
      "total": 1075.0
    },
    "oversize": {
      "towing": 300.0,
      "ocean": 1000.0,
      "total": 1300.0
    }
  },
  "ATLANTA WEST - Georgia": {
    "regular": {
      "towing": 300.0,
      "ocean": 675.0,
      "total": 975.0
    },
    "large": {
      "towing": 300.0,
      "ocean": 775.0,
      "total": 1075.0
    },
    "oversize": {
      "towing": 300.0,
      "ocean": 1000.0,
      "total": 1300.0
    }
  },
  "Augusta - Georgia": {
    "regular": {
      "towing": 275.0,
      "ocean": 675.0,
      "total": 950.0
    },
    "large": {
      "towing": 275.0,
      "ocean": 775.0,
      "total": 1050.0
    },
    "oversize": {
      "towing": 275.0,
      "ocean": 1000.0,
      "total": 1275.0
    }
  },
  "AUSTIN - Texas": {
    "regular": {
      "towing": 250.0,
      "ocean": 750.0,
      "total": 1000.0
    },
    "large": {
      "towing": 250.0,
      "ocean": 850.0,
      "total": 1100.0
    },
    "oversize": {
      "towing": 250.0,
      "ocean": 1100.0,
      "total": 1350.0
    }
  },
  "BAKERSFIELD - California": {
    "regular": {
      "towing": 350.0,
      "ocean": 1200.0,
      "total": 1550.0
    },
    "large": {
      "towing": 350.0,
      "ocean": 1450.0,
      "total": 1800.0
    },
    "oversize": {
      "towing": 350.0,
      "ocean": 1700.0,
      "total": 2050.0
    }
  },
  "BALTIMORE - Maryland": {
    "regular": {
      "towing": 325.0,
      "ocean": 675.0,
      "total": 1000.0
    },
    "large": {
      "towing": 325.0,
      "ocean": 775.0,
      "total": 1100.0
    },
    "oversize": {
      "towing": 325.0,
      "ocean": 1000.0,
      "total": 1325.0
    }
  },
  "BALTIMORE EAST - Maryland": {
    "regular": {
      "towing": 325.0,
      "ocean": 675.0,
      "total": 1000.0
    },
    "large": {
      "towing": 325.0,
      "ocean": 775.0,
      "total": 1100.0
    },
    "oversize": {
      "towing": 325.0,
      "ocean": 1000.0,
      "total": 1325.0
    }
  },
  "BATON ROUGE - Louisiana": {
    "regular": {
      "towing": 350.0,
      "ocean": 750.0,
      "total": 1100.0
    },
    "large": {
      "towing": 350.0,
      "ocean": 850.0,
      "total": 1200.0
    },
    "oversize": {
      "towing": 350.0,
      "ocean": 1100.0,
      "total": 1450.0
    }
  },
  "BILLINGS - Montana": {
    "regular": {
      "towing": 850.0,
      "ocean": 1625.0,
      "total": 2475.0
    },
    "large": {
      "towing": 850.0,
      "ocean": 1800.0,
      "total": 2650.0
    },
    "oversize": {
      "towing": 850.0,
      "ocean": 2200.0,
      "total": 3050.0
    }
  },
  "BIRMINGHAM - Alabama": {
    "regular": {
      "towing": 375.0,
      "ocean": 675.0,
      "total": 1050.0
    },
    "large": {
      "towing": 375.0,
      "ocean": 775.0,
      "total": 1150.0
    },
    "oversize": {
      "towing": 375.0,
      "ocean": 1000.0,
      "total": 1375.0
    }
  },
  "BOISE - Idaho": {
    "regular": {
      "towing": 450.0,
      "ocean": 1625.0,
      "total": 2075.0
    },
    "large": {
      "towing": 450.0,
      "ocean": 1800.0,
      "total": 2250.0
    },
    "oversize": {
      "towing": 450.0,
      "ocean": 2200.0,
      "total": 2650.0
    }
  },
  "Buffalo - New York": {
    "regular": {
      "towing": 500.0,
      "ocean": 700.0,
      "total": 1200.0
    },
    "large": {
      "towing": 500.0,
      "ocean": 800.0,
      "total": 1300.0
    },
    "oversize": {
      "towing": 500.0,
      "ocean": 1050.0,
      "total": 1550.0
    }
  },
  "CALGARY - Alberta": {
    "regular": {
      "towing": 1450.0,
      "ocean": 850.0,
      "total": 2300.0
    },
    "large": {
      "towing": 1450.0,
      "ocean": 950.0,
      "total": 2400.0
    },
    "oversize": {
      "towing": 1450.0,
      "ocean": 1250.0,
      "total": 2700.0
    }
  },
  "CANDIA - New Hampshire": {
    "regular": {
      "towing": 425.0,
      "ocean": 700.0,
      "total": 1125.0
    },
    "large": {
      "towing": 425.0,
      "ocean": 800.0,
      "total": 1225.0
    },
    "oversize": {
      "towing": 425.0,
      "ocean": 1050.0,
      "total": 1475.0
    }
  },
  "CARTERSVILLE - Georgia": {
    "regular": {
      "towing": 300.0,
      "ocean": 675.0,
      "total": 975.0
    },
    "large": {
      "towing": 300.0,
      "ocean": 775.0,
      "total": 1075.0
    },
    "oversize": {
      "towing": 300.0,
      "ocean": 1000.0,
      "total": 1300.0
    }
  },
  "CEDAR RAPIDS - Iowa": {
    "regular": {
      "towing": 400.0,
      "ocean": 850.0,
      "total": 1250.0
    },
    "large": {
      "towing": 400.0,
      "ocean": 950.0,
      "total": 1350.0
    },
    "oversize": {
      "towing": 400.0,
      "ocean": 1250.0,
      "total": 1650.0
    }
  },
  "CHAMBERSBURG - Pennsylvania": {
    "regular": {
      "towing": 350.0,
      "ocean": 700.0,
      "total": 1050.0
    },
    "large": {
      "towing": 350.0,
      "ocean": 800.0,
      "total": 1150.0
    },
    "oversize": {
      "towing": 350.0,
      "ocean": 1050.0,
      "total": 1400.0
    }
  },
  "CHARLESTON - West Virginia": {
    "regular": {
      "towing": 625.0,
      "ocean": 675.0,
      "total": 1300.0
    },
    "large": {
      "towing": 625.0,
      "ocean": 775.0,
      "total": 1400.0
    },
    "oversize": {
      "towing": 625.0,
      "ocean": 1000.0,
      "total": 1625.0
    }
  },
  "CHICAGO NORTH - Illinois": {
    "regular": {
      "towing": 180.0,
      "ocean": 850.0,
      "total": 1030.0
    },
    "large": {
      "towing": 180.0,
      "ocean": 950.0,
      "total": 1130.0
    },
    "oversize": {
      "towing": 180.0,
      "ocean": 1250.0,
      "total": 1430.0
    }
  },
  "CHICAGO SOUTH - Illinois": {
    "regular": {
      "towing": 180.0,
      "ocean": 850.0,
      "total": 1030.0
    },
    "large": {
      "towing": 180.0,
      "ocean": 950.0,
      "total": 1130.0
    },
    "oversize": {
      "towing": 180.0,
      "ocean": 1250.0,
      "total": 1430.0
    }
  },
  "CHINA GROVE - North Carolina": {
    "regular": {
      "towing": 300.0,
      "ocean": 675.0,
      "total": 975.0
    },
    "large": {
      "towing": 300.0,
      "ocean": 775.0,
      "total": 1075.0
    },
    "oversize": {
      "towing": 300.0,
      "ocean": 1000.0,
      "total": 1300.0
    }
  },
  "CICERO - Indiana": {
    "regular": {
      "towing": 300.0,
      "ocean": 850.0,
      "total": 1150.0
    },
    "large": {
      "towing": 300.0,
      "ocean": 950.0,
      "total": 1250.0
    },
    "oversize": {
      "towing": 300.0,
      "ocean": 1250.0,
      "total": 1550.0
    }
  },
  "CLEVELAND EAST - Ohio": {
    "regular": {
      "towing": 550.0,
      "ocean": 675.0,
      "total": 1225.0
    },
    "large": {
      "towing": 550.0,
      "ocean": 775.0,
      "total": 1325.0
    },
    "oversize": {
      "towing": 550.0,
      "ocean": 1000.0,
      "total": 1550.0
    }
  },
  "CLEVELAND WEST - Ohio": {
    "regular": {
      "towing": 550.0,
      "ocean": 675.0,
      "total": 1225.0
    },
    "large": {
      "towing": 550.0,
      "ocean": 775.0,
      "total": 1325.0
    },
    "oversize": {
      "towing": 550.0,
      "ocean": 1000.0,
      "total": 1550.0
    }
  },
  "CLEWISTON - Florida": {
    "regular": {
      "towing": 275.0,
      "ocean": 750.0,
      "total": 1025.0
    },
    "large": {
      "towing": 275.0,
      "ocean": 850.0,
      "total": 1125.0
    },
    "oversize": {
      "towing": 275.0,
      "ocean": 1100.0,
      "total": 1375.0
    }
  },
  "COLORADO SPRINGS - Colorado": {
    "regular": {
      "towing": 650.0,
      "ocean": 850.0,
      "total": 1500.0
    },
    "large": {
      "towing": 650.0,
      "ocean": 950.0,
      "total": 1600.0
    },
    "oversize": {
      "towing": 650.0,
      "ocean": 1250.0,
      "total": 1900.0
    }
  },
  "COLUMBUS - Ohio": {
    "regular": {
      "towing": 550.0,
      "ocean": 675.0,
      "total": 1225.0
    },
    "large": {
      "towing": 550.0,
      "ocean": 775.0,
      "total": 1325.0
    },
    "oversize": {
      "towing": 550.0,
      "ocean": 1000.0,
      "total": 1550.0
    }
  },
  "CONCORD - North Carolina": {
    "regular": {
      "towing": 300.0,
      "ocean": 675.0,
      "total": 975.0
    },
    "large": {
      "towing": 300.0,
      "ocean": 775.0,
      "total": 1075.0
    },
    "oversize": {
      "towing": 300.0,
      "ocean": 1000.0,
      "total": 1300.0
    }
  },
  "CORPUS CHRISTI - Texas": {
    "regular": {
      "towing": 275.0,
      "ocean": 750.0,
      "total": 1025.0
    },
    "large": {
      "towing": 275.0,
      "ocean": 850.0,
      "total": 1125.0
    },
    "oversize": {
      "towing": 275.0,
      "ocean": 1100.0,
      "total": 1375.0
    }
  },
  "CRASHEDTOYS ATLANTA - Georgia": {
    "regular": {
      "towing": 275.0,
      "ocean": 675.0,
      "total": 950.0
    },
    "large": {
      "towing": 275.0,
      "ocean": 775.0,
      "total": 1050.0
    },
    "oversize": {
      "towing": 275.0,
      "ocean": 1000.0,
      "total": 1275.0
    }
  },
  "CRASHEDTOYS DALLAS - Texas": {
    "regular": {
      "towing": 275.0,
      "ocean": 750.0,
      "total": 1025.0
    },
    "large": {
      "towing": 275.0,
      "ocean": 850.0,
      "total": 1125.0
    },
    "oversize": {
      "towing": 275.0,
      "ocean": 1100.0,
      "total": 1375.0
    }
  },
  "CUSSETA - Alabama": {
    "regular": {
      "towing": 400.0,
      "ocean": 675.0,
      "total": 1075.0
    },
    "large": {
      "towing": 400.0,
      "ocean": 775.0,
      "total": 1175.0
    },
    "oversize": {
      "towing": 400.0,
      "ocean": 1000.0,
      "total": 1400.0
    }
  },
  "DALLAS - Texas": {
    "regular": {
      "towing": 275.0,
      "ocean": 750.0,
      "total": 1025.0
    },
    "large": {
      "towing": 275.0,
      "ocean": 850.0,
      "total": 1125.0
    },
    "oversize": {
      "towing": 275.0,
      "ocean": 1100.0,
      "total": 1375.0
    }
  },
  "DALLAS SOUTH - Texas": {
    "regular": {
      "towing": 275.0,
      "ocean": 750.0,
      "total": 1025.0
    },
    "large": {
      "towing": 275.0,
      "ocean": 850.0,
      "total": 1125.0
    },
    "oversize": {
      "towing": 275.0,
      "ocean": 1100.0,
      "total": 1375.0
    }
  },
  "DANVILLE - Virginia": {
    "regular": {
      "towing": 300.0,
      "ocean": 675.0,
      "total": 975.0
    },
    "large": {
      "towing": 300.0,
      "ocean": 775.0,
      "total": 1075.0
    },
    "oversize": {
      "towing": 300.0,
      "ocean": 1000.0,
      "total": 1300.0
    }
  },
  "DAVENPORT - 169 Davenport sublot": {
    "regular": {
      "towing": 325.0,
      "ocean": 850.0,
      "total": 1175.0
    },
    "large": {
      "towing": 325.0,
      "ocean": 950.0,
      "total": 1275.0
    },
    "oversize": {
      "towing": 325.0,
      "ocean": 1250.0,
      "total": 1575.0
    }
  },
  "DAVENPORT - Iowa": {
    "regular": {
      "towing": 325.0,
      "ocean": 850.0,
      "total": 1175.0
    },
    "large": {
      "towing": 325.0,
      "ocean": 950.0,
      "total": 1275.0
    },
    "oversize": {
      "towing": 325.0,
      "ocean": 1250.0,
      "total": 1575.0
    }
  },
  "DAYTON - Ohio": {
    "regular": {
      "towing": 550.0,
      "ocean": 675.0,
      "total": 1225.0
    },
    "large": {
      "towing": 550.0,
      "ocean": 775.0,
      "total": 1325.0
    },
    "oversize": {
      "towing": 550.0,
      "ocean": 1000.0,
      "total": 1550.0
    }
  },
  "DENVER - Colorado": {
    "regular": {
      "towing": 650.0,
      "ocean": 850.0,
      "total": 1500.0
    },
    "large": {
      "towing": 650.0,
      "ocean": 950.0,
      "total": 1600.0
    },
    "oversize": {
      "towing": 650.0,
      "ocean": 1250.0,
      "total": 1900.0
    }
  },
  "DENVER CENTRAL - Colorado": {
    "regular": {
      "towing": 650.0,
      "ocean": 850.0,
      "total": 1500.0
    },
    "large": {
      "towing": 650.0,
      "ocean": 950.0,
      "total": 1600.0
    },
    "oversize": {
      "towing": 650.0,
      "ocean": 1250.0,
      "total": 1900.0
    }
  },
  "DENVER SOUTH - Colorado": {
    "regular": {
      "towing": 650.0,
      "ocean": 850.0,
      "total": 1500.0
    },
    "large": {
      "towing": 650.0,
      "ocean": 950.0,
      "total": 1600.0
    },
    "oversize": {
      "towing": 650.0,
      "ocean": 1250.0,
      "total": 1900.0
    }
  },
  "DES MOINES - Iowa": {
    "regular": {
      "towing": 400.0,
      "ocean": 850.0,
      "total": 1250.0
    },
    "large": {
      "towing": 400.0,
      "ocean": 950.0,
      "total": 1350.0
    },
    "oversize": {
      "towing": 400.0,
      "ocean": 1250.0,
      "total": 1650.0
    }
  },
  "DETROIT - Michigan": {
    "regular": {
      "towing": 400.0,
      "ocean": 850.0,
      "total": 1250.0
    },
    "large": {
      "towing": 400.0,
      "ocean": 950.0,
      "total": 1350.0
    },
    "oversize": {
      "towing": 400.0,
      "ocean": 1250.0,
      "total": 1650.0
    }
  },
  "DOTHAN - Alabama": {
    "regular": {
      "towing": 375.0,
      "ocean": 675.0,
      "total": 1050.0
    },
    "large": {
      "towing": 375.0,
      "ocean": 775.0,
      "total": 1150.0
    },
    "oversize": {
      "towing": 375.0,
      "ocean": 1000.0,
      "total": 1375.0
    }
  },
  "DYER - Indiana": {
    "regular": {
      "towing": 180.0,
      "ocean": 850.0,
      "total": 1030.0
    },
    "large": {
      "towing": 180.0,
      "ocean": 950.0,
      "total": 1130.0
    },
    "oversize": {
      "towing": 180.0,
      "ocean": 1250.0,
      "total": 1430.0
    }
  },
  "EARLINGTON - Kentucky": {
    "regular": {
      "towing": 550.0,
      "ocean": 675.0,
      "total": 1225.0
    },
    "large": {
      "towing": 550.0,
      "ocean": 775.0,
      "total": 1325.0
    },
    "oversize": {
      "towing": 550.0,
      "ocean": 1000.0,
      "total": 1550.0
    }
  },
  "EDMONTON - Alberta": {
    "regular": {
      "towing": 1450.0,
      "ocean": 850.0,
      "total": 2300.0
    },
    "large": {
      "towing": 1450.0,
      "ocean": 950.0,
      "total": 2400.0
    },
    "oversize": {
      "towing": 1450.0,
      "ocean": 1250.0,
      "total": 2700.0
    }
  },
  "EL PASO - Texas": {
    "regular": {
      "towing": 425.0,
      "ocean": 750.0,
      "total": 1175.0
    },
    "large": {
      "towing": 425.0,
      "ocean": 850.0,
      "total": 1275.0
    },
    "oversize": {
      "towing": 425.0,
      "ocean": 1100.0,
      "total": 1525.0
    }
  },
  "EUGENE - Oregon": {
    "regular": {
      "towing": 375.0,
      "ocean": 1625.0,
      "total": 2000.0
    },
    "large": {
      "towing": 375.0,
      "ocean": 1800.0,
      "total": 2175.0
    },
    "oversize": {
      "towing": 375.0,
      "ocean": 2200.0,
      "total": 2575.0
    }
  },
  "EXETER - Rhode Island": {
    "regular": {
      "towing": 350.0,
      "ocean": 700.0,
      "total": 1050.0
    },
    "large": {
      "towing": 350.0,
      "ocean": 800.0,
      "total": 1150.0
    },
    "oversize": {
      "towing": 350.0,
      "ocean": 1050.0,
      "total": 1400.0
    }
  },
  "FAIRBURN - Georgia": {
    "regular": {
      "towing": 275.0,
      "ocean": 675.0,
      "total": 950.0
    },
    "large": {
      "towing": 275.0,
      "ocean": 775.0,
      "total": 1050.0
    },
    "oversize": {
      "towing": 275.0,
      "ocean": 1000.0,
      "total": 1275.0
    }
  },
  "FAYETTEVILLE - Arkansas": {
    "regular": {
      "towing": 475.0,
      "ocean": 750.0,
      "total": 1225.0
    },
    "large": {
      "towing": 475.0,
      "ocean": 850.0,
      "total": 1325.0
    },
    "oversize": {
      "towing": 475.0,
      "ocean": 1100.0,
      "total": 1575.0
    }
  },
  "FLINT - Michigan": {
    "regular": {
      "towing": 450.0,
      "ocean": 850.0,
      "total": 1300.0
    },
    "large": {
      "towing": 450.0,
      "ocean": 950.0,
      "total": 1400.0
    },
    "oversize": {
      "towing": 450.0,
      "ocean": 1250.0,
      "total": 1700.0
    }
  },
  "FORT WAYNE - Indiana": {
    "regular": {
      "towing": 300.0,
      "ocean": 850.0,
      "total": 1150.0
    },
    "large": {
      "towing": 300.0,
      "ocean": 950.0,
      "total": 1250.0
    },
    "oversize": {
      "towing": 300.0,
      "ocean": 1250.0,
      "total": 1550.0
    }
  },
  "FREDERICKSBURG - Virginia": {
    "regular": {
      "towing": 300.0,
      "ocean": 675.0,
      "total": 975.0
    },
    "large": {
      "towing": 300.0,
      "ocean": 775.0,
      "total": 1075.0
    },
    "oversize": {
      "towing": 300.0,
      "ocean": 1000.0,
      "total": 1300.0
    }
  },
  "FREETOWN - Massachusetts": {
    "regular": {
      "towing": 375.0,
      "ocean": 700.0,
      "total": 1075.0
    },
    "large": {
      "towing": 375.0,
      "ocean": 800.0,
      "total": 1175.0
    },
    "oversize": {
      "towing": 375.0,
      "ocean": 1050.0,
      "total": 1425.0
    }
  },
  "FRESNO - California": {
    "regular": {
      "towing": 375.0,
      "ocean": 1200.0,
      "total": 1575.0
    },
    "large": {
      "towing": 375.0,
      "ocean": 1450.0,
      "total": 1825.0
    },
    "oversize": {
      "towing": 375.0,
      "ocean": 1700.0,
      "total": 2075.0
    }
  },
  "FT. PIERCE - Florida": {
    "regular": {
      "towing": 200.0,
      "ocean": 750.0,
      "total": 950.0
    },
    "large": {
      "towing": 200.0,
      "ocean": 850.0,
      "total": 1050.0
    },
    "oversize": {
      "towing": 200.0,
      "ocean": 1100.0,
      "total": 1300.0
    }
  },
  "FT. WORTH - Texas": {
    "regular": {
      "towing": 275.0,
      "ocean": 750.0,
      "total": 1025.0
    },
    "large": {
      "towing": 275.0,
      "ocean": 850.0,
      "total": 1125.0
    },
    "oversize": {
      "towing": 275.0,
      "ocean": 1100.0,
      "total": 1375.0
    }
  },
  "GASTONIA - North Carolina": {
    "regular": {
      "towing": 325.0,
      "ocean": 675.0,
      "total": 1000.0
    },
    "large": {
      "towing": 325.0,
      "ocean": 775.0,
      "total": 1100.0
    },
    "oversize": {
      "towing": 325.0,
      "ocean": 1000.0,
      "total": 1325.0
    }
  },
  "GLASSBORO EAST - New Jersey": {
    "regular": {
      "towing": 200.0,
      "ocean": 700.0,
      "total": 900.0
    },
    "large": {
      "towing": 200.0,
      "ocean": 800.0,
      "total": 1000.0
    },
    "oversize": {
      "towing": 200.0,
      "ocean": 1050.0,
      "total": 1250.0
    }
  },
  "GLASSBORO WEST - New Jersey": {
    "regular": {
      "towing": 200.0,
      "ocean": 700.0,
      "total": 900.0
    },
    "large": {
      "towing": 200.0,
      "ocean": 800.0,
      "total": 1000.0
    },
    "oversize": {
      "towing": 200.0,
      "ocean": 1050.0,
      "total": 1250.0
    }
  },
  "GRAHAM - Washington": {
    "regular": {
      "towing": 150.0,
      "ocean": 1625.0,
      "total": 1775.0
    },
    "large": {
      "towing": 150.0,
      "ocean": 1800.0,
      "total": 1950.0
    },
    "oversize": {
      "towing": 150.0,
      "ocean": 2200.0,
      "total": 2350.0
    }
  },
  "Grenada - Mississippi": {
    "regular": {
      "towing": 475.0,
      "ocean": 750.0,
      "total": 1225.0
    },
    "large": {
      "towing": 475.0,
      "ocean": 850.0,
      "total": 1325.0
    },
    "oversize": {
      "towing": 475.0,
      "ocean": 1100.0,
      "total": 1575.0
    }
  },
  "HALIFAX - Nova Scotia": {
    "regular": {
      "towing": 1200.0,
      "ocean": 850.0,
      "total": 2050.0
    },
    "large": {
      "towing": 1200.0,
      "ocean": 950.0,
      "total": 2150.0
    },
    "oversize": {
      "towing": 1200.0,
      "ocean": 1250.0,
      "total": 2450.0
    }
  },
  "HAMPTON - Virginia": {
    "regular": {
      "towing": 200.0,
      "ocean": 675.0,
      "total": 875.0
    },
    "large": {
      "towing": 200.0,
      "ocean": 775.0,
      "total": 975.0
    },
    "oversize": {
      "towing": 200.0,
      "ocean": 1000.0,
      "total": 1200.0
    }
  },
  "HARRISBURG - Pennsylvania": {
    "regular": {
      "towing": 275.0,
      "ocean": 700.0,
      "total": 975.0
    },
    "large": {
      "towing": 275.0,
      "ocean": 800.0,
      "total": 1075.0
    },
    "oversize": {
      "towing": 275.0,
      "ocean": 1050.0,
      "total": 1325.0
    }
  },
  "HARTFORD - Connecticut": {
    "regular": {
      "towing": 250.0,
      "ocean": 700.0,
      "total": 950.0
    },
    "large": {
      "towing": 250.0,
      "ocean": 800.0,
      "total": 1050.0
    },
    "oversize": {
      "towing": 250.0,
      "ocean": 1050.0,
      "total": 1300.0
    }
  },
  "HARTFORD SPRINGFIELD - Connecticut": {
    "regular": {
      "towing": 250.0,
      "ocean": 700.0,
      "total": 950.0
    },
    "large": {
      "towing": 250.0,
      "ocean": 800.0,
      "total": 1050.0
    },
    "oversize": {
      "towing": 250.0,
      "ocean": 1050.0,
      "total": 1300.0
    }
  },
  "HAYWARD - California": {
    "regular": {
      "towing": 400.0,
      "ocean": 1200.0,
      "total": 1600.0
    },
    "large": {
      "towing": 400.0,
      "ocean": 1450.0,
      "total": 1850.0
    },
    "oversize": {
      "towing": 400.0,
      "ocean": 1700.0,
      "total": 2100.0
    }
  },
  "HELENA - Montana": {
    "regular": {
      "towing": 750.0,
      "ocean": 1625.0,
      "total": 2375.0
    },
    "large": {
      "towing": 750.0,
      "ocean": 1800.0,
      "total": 2550.0
    },
    "oversize": {
      "towing": 750.0,
      "ocean": 2200.0,
      "total": 2950.0
    }
  },
  "HONOLULU - Hawaii": {
    "regular": {
      "towing": 120.0,
      "ocean": 2250.0,
      "total": 2370.0
    },
    "large": {
      "towing": 120.0,
      "ocean": 2450.0,
      "total": 2570.0
    },
    "oversize": {
      "towing": 120.0,
      "ocean": 3000.0,
      "total": 3120.0
    }
  },
  "HOUSTON - Texas": {
    "regular": {
      "towing": 180.0,
      "ocean": 750.0,
      "total": 930.0
    },
    "large": {
      "towing": 180.0,
      "ocean": 850.0,
      "total": 1030.0
    },
    "oversize": {
      "towing": 180.0,
      "ocean": 1100.0,
      "total": 1280.0
    }
  },
  "HOUSTON EAST - Texas": {
    "regular": {
      "towing": 180.0,
      "ocean": 750.0,
      "total": 930.0
    },
    "large": {
      "towing": 180.0,
      "ocean": 850.0,
      "total": 1030.0
    },
    "oversize": {
      "towing": 180.0,
      "ocean": 1100.0,
      "total": 1280.0
    }
  },
  "INDIANAPOLIS - Indiana": {
    "regular": {
      "towing": 300.0,
      "ocean": 850.0,
      "total": 1150.0
    },
    "large": {
      "towing": 300.0,
      "ocean": 950.0,
      "total": 1250.0
    },
    "oversize": {
      "towing": 300.0,
      "ocean": 1250.0,
      "total": 1550.0
    }
  },
  "IONIA - Michigan": {
    "regular": {
      "towing": 400.0,
      "ocean": 850.0,
      "total": 1250.0
    },
    "large": {
      "towing": 400.0,
      "ocean": 950.0,
      "total": 1350.0
    },
    "oversize": {
      "towing": 400.0,
      "ocean": 1250.0,
      "total": 1650.0
    }
  },
  "JACKSON - Mississippi": {
    "regular": {
      "towing": 425.0,
      "ocean": 750.0,
      "total": 1175.0
    },
    "large": {
      "towing": 425.0,
      "ocean": 850.0,
      "total": 1275.0
    },
    "oversize": {
      "towing": 425.0,
      "ocean": 1100.0,
      "total": 1525.0
    }
  },
  "JACKSONVILLE EAST - Florida": {
    "regular": {
      "towing": 225.0,
      "ocean": 675.0,
      "total": 900.0
    },
    "large": {
      "towing": 225.0,
      "ocean": 775.0,
      "total": 1000.0
    },
    "oversize": {
      "towing": 225.0,
      "ocean": 1000.0,
      "total": 1225.0
    }
  },
  "JACKSONVILLE NORTH - Florida": {
    "regular": {
      "towing": 225.0,
      "ocean": 675.0,
      "total": 900.0
    },
    "large": {
      "towing": 225.0,
      "ocean": 775.0,
      "total": 1000.0
    },
    "oversize": {
      "towing": 225.0,
      "ocean": 1000.0,
      "total": 1225.0
    }
  },
  "JACKSONVILLE WEST - Florida": {
    "regular": {
      "towing": 225.0,
      "ocean": 675.0,
      "total": 900.0
    },
    "large": {
      "towing": 225.0,
      "ocean": 775.0,
      "total": 1000.0
    },
    "oversize": {
      "towing": 225.0,
      "ocean": 1000.0,
      "total": 1225.0
    }
  },
  "KANSAS CITY - Kansas": {
    "regular": {
      "towing": 625.0,
      "ocean": 675.0,
      "total": 1300.0
    },
    "large": {
      "towing": 625.0,
      "ocean": 775.0,
      "total": 1400.0
    },
    "oversize": {
      "towing": 625.0,
      "ocean": 1000.0,
      "total": 1625.0
    }
  },
  "KENS TOWING HILO - Hawaii": {
    "regular": {
      "towing": 2350.0,
      "ocean": 1200.0,
      "total": 3550.0
    },
    "large": {
      "towing": 2350.0,
      "ocean": 1450.0,
      "total": 3800.0
    },
    "oversize": {
      "towing": 2350.0,
      "ocean": 1700.0,
      "total": 4050.0
    }
  },
  "KINCHELOE - Michigan": {
    "regular": {
      "towing": 750.0,
      "ocean": 850.0,
      "total": 1600.0
    },
    "large": {
      "towing": 750.0,
      "ocean": 950.0,
      "total": 1700.0
    },
    "oversize": {
      "towing": 750.0,
      "ocean": 1250.0,
      "total": 2000.0
    }
  },
  "KINDAQUICK TOWING LLC - Hawaii": {
    "regular": {
      "towing": 2750.0,
      "ocean": 1200.0,
      "total": 3950.0
    },
    "large": {
      "towing": 2750.0,
      "ocean": 1450.0,
      "total": 4200.0
    },
    "oversize": {
      "towing": 2750.0,
      "ocean": 1700.0,
      "total": 4450.0
    }
  },
  "KNOXVILLE - Tennessee": {
    "regular": {
      "towing": 400.0,
      "ocean": 675.0,
      "total": 1075.0
    },
    "large": {
      "towing": 400.0,
      "ocean": 775.0,
      "total": 1175.0
    },
    "oversize": {
      "towing": 400.0,
      "ocean": 1000.0,
      "total": 1400.0
    }
  },
  "LAGRANGE - North Carolina": {
    "regular": {
      "towing": 325.0,
      "ocean": 675.0,
      "total": 1000.0
    },
    "large": {
      "towing": 325.0,
      "ocean": 775.0,
      "total": 1100.0
    },
    "oversize": {
      "towing": 325.0,
      "ocean": 1000.0,
      "total": 1325.0
    }
  },
  "LANSING - Michigan": {
    "regular": {
      "towing": 400.0,
      "ocean": 850.0,
      "total": 1250.0
    },
    "large": {
      "towing": 400.0,
      "ocean": 950.0,
      "total": 1350.0
    },
    "oversize": {
      "towing": 400.0,
      "ocean": 1250.0,
      "total": 1650.0
    }
  },
  "LAS VEGAS - Nevada": {
    "regular": {
      "towing": 325.0,
      "ocean": 1200.0,
      "total": 1525.0
    },
    "large": {
      "towing": 325.0,
      "ocean": 1450.0,
      "total": 1775.0
    },
    "oversize": {
      "towing": 325.0,
      "ocean": 1700.0,
      "total": 2025.0
    }
  },
  "LAS VEGAS WEST - Nevada": {
    "regular": {
      "towing": 375.0,
      "ocean": 1200.0,
      "total": 1575.0
    },
    "large": {
      "towing": 375.0,
      "ocean": 1450.0,
      "total": 1825.0
    },
    "oversize": {
      "towing": 375.0,
      "ocean": 1700.0,
      "total": 2075.0
    }
  },
  "LEXINGTON EAST - Kentucky": {
    "regular": {
      "towing": 550.0,
      "ocean": 675.0,
      "total": 1225.0
    },
    "large": {
      "towing": 550.0,
      "ocean": 775.0,
      "total": 1325.0
    },
    "oversize": {
      "towing": 550.0,
      "ocean": 1000.0,
      "total": 1550.0
    }
  },
  "LEXINGTON WEST - Kentucky": {
    "regular": {
      "towing": 550.0,
      "ocean": 675.0,
      "total": 1225.0
    },
    "large": {
      "towing": 550.0,
      "ocean": 775.0,
      "total": 1325.0
    },
    "oversize": {
      "towing": 550.0,
      "ocean": 1000.0,
      "total": 1550.0
    }
  },
  "LINCOLN - Nebraska": {
    "regular": {
      "towing": 450.0,
      "ocean": 850.0,
      "total": 1300.0
    },
    "large": {
      "towing": 450.0,
      "ocean": 950.0,
      "total": 1400.0
    },
    "oversize": {
      "towing": 450.0,
      "ocean": 1250.0,
      "total": 1700.0
    }
  },
  "LITTLE ROCK - Arkansas": {
    "regular": {
      "towing": 450.0,
      "ocean": 750.0,
      "total": 1200.0
    },
    "large": {
      "towing": 450.0,
      "ocean": 850.0,
      "total": 1300.0
    },
    "oversize": {
      "towing": 450.0,
      "ocean": 1100.0,
      "total": 1550.0
    }
  },
  "LONDON - Ontario": {
    "regular": {
      "towing": 250.0,
      "ocean": 850.0,
      "total": 1100.0
    },
    "large": {
      "towing": 250.0,
      "ocean": 950.0,
      "total": 1200.0
    },
    "oversize": {
      "towing": 250.0,
      "ocean": 1250.0,
      "total": 1500.0
    }
  },
  "LONG BEACH - California": {
    "regular": {
      "towing": 150.0,
      "ocean": 1200.0,
      "total": 1350.0
    },
    "large": {
      "towing": 150.0,
      "ocean": 1450.0,
      "total": 1600.0
    },
    "oversize": {
      "towing": 150.0,
      "ocean": 1700.0,
      "total": 1850.0
    }
  },
  "LONG ISLAND - New York": {
    "regular": {
      "towing": 250.0,
      "ocean": 700.0,
      "total": 950.0
    },
    "large": {
      "towing": 250.0,
      "ocean": 800.0,
      "total": 1050.0
    },
    "oversize": {
      "towing": 250.0,
      "ocean": 1050.0,
      "total": 1300.0
    }
  },
  "LONGVIEW - Texas": {
    "regular": {
      "towing": 275.0,
      "ocean": 750.0,
      "total": 1025.0
    },
    "large": {
      "towing": 275.0,
      "ocean": 850.0,
      "total": 1125.0
    },
    "oversize": {
      "towing": 275.0,
      "ocean": 1100.0,
      "total": 1375.0
    }
  },
  "LOS ANGELES - California": {
    "regular": {
      "towing": 160.0,
      "ocean": 1200.0,
      "total": 1360.0
    },
    "large": {
      "towing": 160.0,
      "ocean": 1450.0,
      "total": 1610.0
    },
    "oversize": {
      "towing": 160.0,
      "ocean": 1700.0,
      "total": 1860.0
    }
  },
  "LOUISVILLE - Kentucky": {
    "regular": {
      "towing": 550.0,
      "ocean": 675.0,
      "total": 1225.0
    },
    "large": {
      "towing": 550.0,
      "ocean": 775.0,
      "total": 1325.0
    },
    "oversize": {
      "towing": 550.0,
      "ocean": 1000.0,
      "total": 1550.0
    }
  },
  "LUFKIN - Texas": {
    "regular": {
      "towing": 275.0,
      "ocean": 750.0,
      "total": 1025.0
    },
    "large": {
      "towing": 275.0,
      "ocean": 850.0,
      "total": 1125.0
    },
    "oversize": {
      "towing": 275.0,
      "ocean": 1100.0,
      "total": 1375.0
    }
  },
  "LUMBERTON - North Carolina": {
    "regular": {
      "towing": 300.0,
      "ocean": 675.0,
      "total": 975.0
    },
    "large": {
      "towing": 300.0,
      "ocean": 775.0,
      "total": 1075.0
    },
    "oversize": {
      "towing": 300.0,
      "ocean": 1000.0,
      "total": 1300.0
    }
  },
  "LYMAN - Maine": {
    "regular": {
      "towing": 500.0,
      "ocean": 700.0,
      "total": 1200.0
    },
    "large": {
      "towing": 500.0,
      "ocean": 800.0,
      "total": 1300.0
    },
    "oversize": {
      "towing": 500.0,
      "ocean": 1050.0,
      "total": 1550.0
    }
  },
  "MACON - Georgia": {
    "regular": {
      "towing": 250.0,
      "ocean": 675.0,
      "total": 925.0
    },
    "large": {
      "towing": 250.0,
      "ocean": 775.0,
      "total": 1025.0
    },
    "oversize": {
      "towing": 250.0,
      "ocean": 1000.0,
      "total": 1250.0
    }
  },
  "MADISON - Wisconsin": {
    "regular": {
      "towing": 300.0,
      "ocean": 850.0,
      "total": 1150.0
    },
    "large": {
      "towing": 300.0,
      "ocean": 950.0,
      "total": 1250.0
    },
    "oversize": {
      "towing": 300.0,
      "ocean": 1250.0,
      "total": 1550.0
    }
  },
  "MADISON SOUTH - Wisconsin": {
    "regular": {
      "towing": 300.0,
      "ocean": 850.0,
      "total": 1150.0
    },
    "large": {
      "towing": 300.0,
      "ocean": 950.0,
      "total": 1250.0
    },
    "oversize": {
      "towing": 300.0,
      "ocean": 1250.0,
      "total": 1550.0
    }
  },
  "MARTINEZ - California": {
    "regular": {
      "towing": 400.0,
      "ocean": 1200.0,
      "total": 1600.0
    },
    "large": {
      "towing": 400.0,
      "ocean": 1450.0,
      "total": 1850.0
    },
    "oversize": {
      "towing": 400.0,
      "ocean": 1700.0,
      "total": 2100.0
    }
  },
  "MCALLEN - Texas": {
    "regular": {
      "towing": 350.0,
      "ocean": 750.0,
      "total": 1100.0
    },
    "large": {
      "towing": 350.0,
      "ocean": 850.0,
      "total": 1200.0
    },
    "oversize": {
      "towing": 350.0,
      "ocean": 1100.0,
      "total": 1450.0
    }
  },
  "MEBANE - North Carolina": {
    "regular": {
      "towing": 300.0,
      "ocean": 675.0,
      "total": 975.0
    },
    "large": {
      "towing": 300.0,
      "ocean": 775.0,
      "total": 1075.0
    },
    "oversize": {
      "towing": 300.0,
      "ocean": 1000.0,
      "total": 1300.0
    }
  },
  "MEMPHIS - Tennessee": {
    "regular": {
      "towing": 500.0,
      "ocean": 675.0,
      "total": 1175.0
    },
    "large": {
      "towing": 500.0,
      "ocean": 775.0,
      "total": 1275.0
    },
    "oversize": {
      "towing": 500.0,
      "ocean": 1000.0,
      "total": 1500.0
    }
  },
  "MENTONE - California": {
    "regular": {
      "towing": 300.0,
      "ocean": 1200.0,
      "total": 1500.0
    },
    "large": {
      "towing": 300.0,
      "ocean": 1450.0,
      "total": 1750.0
    },
    "oversize": {
      "towing": 300.0,
      "ocean": 1700.0,
      "total": 2000.0
    }
  },
  "MIAMI CENTRAL - Florida": {
    "regular": {
      "towing": 125.0,
      "ocean": 750.0,
      "total": 875.0
    },
    "large": {
      "towing": 125.0,
      "ocean": 850.0,
      "total": 975.0
    },
    "oversize": {
      "towing": 125.0,
      "ocean": 1100.0,
      "total": 1225.0
    }
  },
  "MIAMI NORTH - Florida": {
    "regular": {
      "towing": 125.0,
      "ocean": 750.0,
      "total": 875.0
    },
    "large": {
      "towing": 125.0,
      "ocean": 850.0,
      "total": 975.0
    },
    "oversize": {
      "towing": 125.0,
      "ocean": 1100.0,
      "total": 1225.0
    }
  },
  "MIAMI SOUTH - Florida": {
    "regular": {
      "towing": 150.0,
      "ocean": 750.0,
      "total": 900.0
    },
    "large": {
      "towing": 150.0,
      "ocean": 850.0,
      "total": 1000.0
    },
    "oversize": {
      "towing": 150.0,
      "ocean": 1100.0,
      "total": 1250.0
    }
  },
  "MILWAUKEE - Wisconsin": {
    "regular": {
      "towing": 225.0,
      "ocean": 850.0,
      "total": 1075.0
    },
    "large": {
      "towing": 225.0,
      "ocean": 950.0,
      "total": 1175.0
    },
    "oversize": {
      "towing": 225.0,
      "ocean": 1250.0,
      "total": 1475.0
    }
  },
  "MILWAUKEE NORTH - Wisconsin": {
    "regular": {
      "towing": 225.0,
      "ocean": 850.0,
      "total": 1075.0
    },
    "large": {
      "towing": 225.0,
      "ocean": 950.0,
      "total": 1175.0
    },
    "oversize": {
      "towing": 225.0,
      "ocean": 1250.0,
      "total": 1475.0
    }
  },
  "MILWAUKEE SOUTH - Wisconsin": {
    "regular": {
      "towing": 225.0,
      "ocean": 850.0,
      "total": 1075.0
    },
    "large": {
      "towing": 225.0,
      "ocean": 950.0,
      "total": 1175.0
    },
    "oversize": {
      "towing": 225.0,
      "ocean": 1250.0,
      "total": 1475.0
    }
  },
  "MINNEAPOLIS - Minnesota": {
    "regular": {
      "towing": 450.0,
      "ocean": 850.0,
      "total": 1300.0
    },
    "large": {
      "towing": 450.0,
      "ocean": 950.0,
      "total": 1400.0
    },
    "oversize": {
      "towing": 450.0,
      "ocean": 1250.0,
      "total": 1700.0
    }
  },
  "MINNEAPOLIS NORTH - Minnesota": {
    "regular": {
      "towing": 450.0,
      "ocean": 850.0,
      "total": 1300.0
    },
    "large": {
      "towing": 450.0,
      "ocean": 950.0,
      "total": 1400.0
    },
    "oversize": {
      "towing": 450.0,
      "ocean": 1250.0,
      "total": 1700.0
    }
  },
  "MO - COLUMBIA": {
    "regular": {
      "towing": 625.0,
      "ocean": 675.0,
      "total": 1300.0
    },
    "large": {
      "towing": 625.0,
      "ocean": 775.0,
      "total": 1400.0
    },
    "oversize": {
      "towing": 625.0,
      "ocean": 1000.0,
      "total": 1625.0
    }
  },
  "MOBILE - Alabama": {
    "regular": {
      "towing": 400.0,
      "ocean": 675.0,
      "total": 1075.0
    },
    "large": {
      "towing": 400.0,
      "ocean": 775.0,
      "total": 1175.0
    },
    "oversize": {
      "towing": 400.0,
      "ocean": 1000.0,
      "total": 1400.0
    }
  },
  "MOBILE SOUTH - Alabama": {
    "regular": {
      "towing": 400.0,
      "ocean": 675.0,
      "total": 1075.0
    },
    "large": {
      "towing": 400.0,
      "ocean": 775.0,
      "total": 1175.0
    },
    "oversize": {
      "towing": 400.0,
      "ocean": 1000.0,
      "total": 1400.0
    }
  },
  "MOCKSVILLE - North Carolina": {
    "regular": {
      "towing": 300.0,
      "ocean": 675.0,
      "total": 975.0
    },
    "large": {
      "towing": 300.0,
      "ocean": 775.0,
      "total": 1075.0
    },
    "oversize": {
      "towing": 300.0,
      "ocean": 1000.0,
      "total": 1300.0
    }
  },
  "MONCTON - New Brunswick": {
    "regular": {
      "towing": 1275.0,
      "ocean": 850.0,
      "total": 2125.0
    },
    "large": {
      "towing": 1275.0,
      "ocean": 950.0,
      "total": 2225.0
    },
    "oversize": {
      "towing": 1275.0,
      "ocean": 1250.0,
      "total": 2525.0
    }
  },
  "MONTGOMERY - Alabama": {
    "regular": {
      "towing": 400.0,
      "ocean": 675.0,
      "total": 1075.0
    },
    "large": {
      "towing": 400.0,
      "ocean": 775.0,
      "total": 1175.0
    },
    "oversize": {
      "towing": 400.0,
      "ocean": 1000.0,
      "total": 1400.0
    }
  },
  "MONTREAL - Quebec": {
    "regular": {
      "towing": 500.0,
      "ocean": 850.0,
      "total": 1350.0
    },
    "large": {
      "towing": 500.0,
      "ocean": 950.0,
      "total": 1450.0
    },
    "oversize": {
      "towing": 500.0,
      "ocean": 1250.0,
      "total": 1750.0
    }
  },
  "N.Boston-ROWLEY Sublot - Massachusetts": {
    "regular": {
      "towing": 450.0,
      "ocean": 700.0,
      "total": 1150.0
    },
    "large": {
      "towing": 450.0,
      "ocean": 800.0,
      "total": 1250.0
    },
    "oversize": {
      "towing": 450.0,
      "ocean": 1050.0,
      "total": 1500.0
    }
  },
  "NAPA - California": {
    "regular": {
      "towing": 475.0,
      "ocean": 1200.0,
      "total": 1675.0
    },
    "large": {
      "towing": 475.0,
      "ocean": 1450.0,
      "total": 1925.0
    },
    "oversize": {
      "towing": 475.0,
      "ocean": 1700.0,
      "total": 2175.0
    }
  },
  "NASHVILLE - Tennessee": {
    "regular": {
      "towing": 400.0,
      "ocean": 675.0,
      "total": 1075.0
    },
    "large": {
      "towing": 400.0,
      "ocean": 775.0,
      "total": 1175.0
    },
    "oversize": {
      "towing": 400.0,
      "ocean": 1000.0,
      "total": 1400.0
    }
  },
  "NEW ORLEANS - Louisiana": {
    "regular": {
      "towing": 400.0,
      "ocean": 750.0,
      "total": 1150.0
    },
    "large": {
      "towing": 400.0,
      "ocean": 850.0,
      "total": 1250.0
    },
    "oversize": {
      "towing": 400.0,
      "ocean": 1100.0,
      "total": 1500.0
    }
  },
  "NEWBURGH - New York": {
    "regular": {
      "towing": 225.0,
      "ocean": 700.0,
      "total": 925.0
    },
    "large": {
      "towing": 225.0,
      "ocean": 800.0,
      "total": 1025.0
    },
    "oversize": {
      "towing": 225.0,
      "ocean": 1050.0,
      "total": 1275.0
    }
  },
  "NORTH AUSTIN - Texas": {
    "regular": {
      "towing": 325.0,
      "ocean": 750.0,
      "total": 1075.0
    },
    "large": {
      "towing": 325.0,
      "ocean": 850.0,
      "total": 1175.0
    },
    "oversize": {
      "towing": 325.0,
      "ocean": 1100.0,
      "total": 1425.0
    }
  },
  "NORTH BOSTON - Massachusetts": {
    "regular": {
      "towing": 375.0,
      "ocean": 700.0,
      "total": 1075.0
    },
    "large": {
      "towing": 375.0,
      "ocean": 800.0,
      "total": 1175.0
    },
    "oversize": {
      "towing": 375.0,
      "ocean": 1050.0,
      "total": 1425.0
    }
  },
  "NORTH CHARLESTON - South Carolina": {
    "regular": {
      "towing": 275.0,
      "ocean": 675.0,
      "total": 950.0
    },
    "large": {
      "towing": 275.0,
      "ocean": 775.0,
      "total": 1050.0
    },
    "oversize": {
      "towing": 275.0,
      "ocean": 1000.0,
      "total": 1275.0
    }
  },
  "NORTH SEATTLE - Washington": {
    "regular": {
      "towing": 225.0,
      "ocean": 1625.0,
      "total": 1850.0
    },
    "large": {
      "towing": 225.0,
      "ocean": 1800.0,
      "total": 2025.0
    },
    "oversize": {
      "towing": 225.0,
      "ocean": 2200.0,
      "total": 2425.0
    }
  },
  "OCALA - Florida": {
    "regular": {
      "towing": 300.0,
      "ocean": 750.0,
      "total": 1050.0
    },
    "large": {
      "towing": 300.0,
      "ocean": 850.0,
      "total": 1150.0
    },
    "oversize": {
      "towing": 300.0,
      "ocean": 1100.0,
      "total": 1400.0
    }
  },
  "OGDEN - Utah": {
    "regular": {
      "towing": 550.0,
      "ocean": 1200.0,
      "total": 1750.0
    },
    "large": {
      "towing": 550.0,
      "ocean": 1450.0,
      "total": 2000.0
    },
    "oversize": {
      "towing": 550.0,
      "ocean": 1700.0,
      "total": 2250.0
    }
  },
  "OKLAHOMA CITY - Oklahoma": {
    "regular": {
      "towing": 400.0,
      "ocean": 750.0,
      "total": 1150.0
    },
    "large": {
      "towing": 400.0,
      "ocean": 850.0,
      "total": 1250.0
    },
    "oversize": {
      "towing": 400.0,
      "ocean": 1100.0,
      "total": 1500.0
    }
  },
  "ORLANDO - Florida": {
    "regular": {
      "towing": 250.0,
      "ocean": 750.0,
      "total": 1000.0
    },
    "large": {
      "towing": 250.0,
      "ocean": 850.0,
      "total": 1100.0
    },
    "oversize": {
      "towing": 250.0,
      "ocean": 1100.0,
      "total": 1350.0
    }
  },
  "ORLANDO NORTH - Florida": {
    "regular": {
      "towing": 250.0,
      "ocean": 750.0,
      "total": 1000.0
    },
    "large": {
      "towing": 250.0,
      "ocean": 850.0,
      "total": 1100.0
    },
    "oversize": {
      "towing": 250.0,
      "ocean": 1100.0,
      "total": 1350.0
    }
  },
  "ORLANDO SOUTH - Florida": {
    "regular": {
      "towing": 250.0,
      "ocean": 750.0,
      "total": 1000.0
    },
    "large": {
      "towing": 250.0,
      "ocean": 850.0,
      "total": 1100.0
    },
    "oversize": {
      "towing": 250.0,
      "ocean": 1100.0,
      "total": 1350.0
    }
  },
  "OTTAWA - Ontario": {
    "regular": {
      "towing": 475.0,
      "ocean": 850.0,
      "total": 1325.0
    },
    "large": {
      "towing": 475.0,
      "ocean": 950.0,
      "total": 1425.0
    },
    "oversize": {
      "towing": 475.0,
      "ocean": 1250.0,
      "total": 1725.0
    }
  },
  "PASCO - Washington": {
    "regular": {
      "towing": 350.0,
      "ocean": 1625.0,
      "total": 1975.0
    },
    "large": {
      "towing": 350.0,
      "ocean": 1800.0,
      "total": 2150.0
    },
    "oversize": {
      "towing": 350.0,
      "ocean": 2200.0,
      "total": 2550.0
    }
  },
  "PEORIA - Illinois": {
    "regular": {
      "towing": 300.0,
      "ocean": 850.0,
      "total": 1150.0
    },
    "large": {
      "towing": 300.0,
      "ocean": 950.0,
      "total": 1250.0
    },
    "oversize": {
      "towing": 300.0,
      "ocean": 1250.0,
      "total": 1550.0
    }
  },
  "PHILADELPHIA - Pennsylvania": {
    "regular": {
      "towing": 225.0,
      "ocean": 700.0,
      "total": 925.0
    },
    "large": {
      "towing": 225.0,
      "ocean": 800.0,
      "total": 1025.0
    },
    "oversize": {
      "towing": 225.0,
      "ocean": 1050.0,
      "total": 1275.0
    }
  },
  "PHILADELPHIA EAST-SUBLOT - Pennsylvania": {
    "regular": {
      "towing": 225.0,
      "ocean": 700.0,
      "total": 925.0
    },
    "large": {
      "towing": 225.0,
      "ocean": 800.0,
      "total": 1025.0
    },
    "oversize": {
      "towing": 225.0,
      "ocean": 1050.0,
      "total": 1275.0
    }
  },
  "PHOENIX - Arizona": {
    "regular": {
      "towing": 350.0,
      "ocean": 1200.0,
      "total": 1550.0
    },
    "large": {
      "towing": 350.0,
      "ocean": 1450.0,
      "total": 1800.0
    },
    "oversize": {
      "towing": 350.0,
      "ocean": 1700.0,
      "total": 2050.0
    }
  },
  "Phoenix North - Arizona": {
    "regular": {
      "towing": 475.0,
      "ocean": 1200.0,
      "total": 1675.0
    },
    "large": {
      "towing": 475.0,
      "ocean": 1450.0,
      "total": 1925.0
    },
    "oversize": {
      "towing": 475.0,
      "ocean": 1700.0,
      "total": 2175.0
    }
  },
  "PITTSBURGH EAST - Pennsylvania": {
    "regular": {
      "towing": 450.0,
      "ocean": 700.0,
      "total": 1150.0
    },
    "large": {
      "towing": 450.0,
      "ocean": 800.0,
      "total": 1250.0
    },
    "oversize": {
      "towing": 450.0,
      "ocean": 1050.0,
      "total": 1500.0
    }
  },
  "PITTSBURGH NORTH - Pennsylvania": {
    "regular": {
      "towing": 450.0,
      "ocean": 700.0,
      "total": 1150.0
    },
    "large": {
      "towing": 450.0,
      "ocean": 800.0,
      "total": 1250.0
    },
    "oversize": {
      "towing": 450.0,
      "ocean": 1050.0,
      "total": 1500.0
    }
  },
  "PITTSBURGH SOUTH - Pennsylvania": {
    "regular": {
      "towing": 450.0,
      "ocean": 700.0,
      "total": 1150.0
    },
    "large": {
      "towing": 450.0,
      "ocean": 800.0,
      "total": 1250.0
    },
    "oversize": {
      "towing": 450.0,
      "ocean": 1050.0,
      "total": 1500.0
    }
  },
  "PITTSBURGH WEST - Pennsylvania": {
    "regular": {
      "towing": 450.0,
      "ocean": 700.0,
      "total": 1150.0
    },
    "large": {
      "towing": 450.0,
      "ocean": 800.0,
      "total": 1250.0
    },
    "oversize": {
      "towing": 450.0,
      "ocean": 1050.0,
      "total": 1500.0
    }
  },
  "PORTLAND NORTH - Oregon": {
    "regular": {
      "towing": 250.0,
      "ocean": 1625.0,
      "total": 1875.0
    },
    "large": {
      "towing": 250.0,
      "ocean": 1800.0,
      "total": 2050.0
    },
    "oversize": {
      "towing": 250.0,
      "ocean": 2200.0,
      "total": 2450.0
    }
  },
  "PORTLAND SOUTH - Oregon": {
    "regular": {
      "towing": 300.0,
      "ocean": 1625.0,
      "total": 1925.0
    },
    "large": {
      "towing": 300.0,
      "ocean": 1800.0,
      "total": 2100.0
    },
    "oversize": {
      "towing": 300.0,
      "ocean": 2200.0,
      "total": 2500.0
    }
  },
  "PUNTA GORDA - Florida": {
    "regular": {
      "towing": 275.0,
      "ocean": 750.0,
      "total": 1025.0
    },
    "large": {
      "towing": 275.0,
      "ocean": 850.0,
      "total": 1125.0
    },
    "oversize": {
      "towing": 275.0,
      "ocean": 1100.0,
      "total": 1375.0
    }
  },
  "PUNTA GORDA SOUTH - Florida": {
    "regular": {
      "towing": 275.0,
      "ocean": 750.0,
      "total": 1025.0
    },
    "large": {
      "towing": 275.0,
      "ocean": 850.0,
      "total": 1125.0
    },
    "oversize": {
      "towing": 275.0,
      "ocean": 1100.0,
      "total": 1375.0
    }
  },
  "RALEIGH - North Carolina": {
    "regular": {
      "towing": 300.0,
      "ocean": 675.0,
      "total": 975.0
    },
    "large": {
      "towing": 300.0,
      "ocean": 775.0,
      "total": 1075.0
    },
    "oversize": {
      "towing": 300.0,
      "ocean": 1000.0,
      "total": 1300.0
    }
  },
  "RALEIGH NORTH - North Carolina": {
    "regular": {
      "towing": 300.0,
      "ocean": 675.0,
      "total": 975.0
    },
    "large": {
      "towing": 300.0,
      "ocean": 775.0,
      "total": 1075.0
    },
    "oversize": {
      "towing": 300.0,
      "ocean": 1000.0,
      "total": 1300.0
    }
  },
  "RANCHO CUCAMONGA - California": {
    "regular": {
      "towing": 200.0,
      "ocean": 1200.0,
      "total": 1400.0
    },
    "large": {
      "towing": 200.0,
      "ocean": 1450.0,
      "total": 1650.0
    },
    "oversize": {
      "towing": 200.0,
      "ocean": 1700.0,
      "total": 1900.0
    }
  },
  "REDDING - California": {
    "regular": {
      "towing": 800.0,
      "ocean": 1200.0,
      "total": 2000.0
    },
    "large": {
      "towing": 800.0,
      "ocean": 1450.0,
      "total": 2250.0
    },
    "oversize": {
      "towing": 800.0,
      "ocean": 1700.0,
      "total": 2500.0
    }
  },
  "RENO - Nevada": {
    "regular": {
      "towing": 550.0,
      "ocean": 1200.0,
      "total": 1750.0
    },
    "large": {
      "towing": 550.0,
      "ocean": 1450.0,
      "total": 2000.0
    },
    "oversize": {
      "towing": 550.0,
      "ocean": 1700.0,
      "total": 2250.0
    }
  },
  "RICHMOND - Virginia": {
    "regular": {
      "towing": 250.0,
      "ocean": 675.0,
      "total": 925.0
    },
    "large": {
      "towing": 250.0,
      "ocean": 775.0,
      "total": 1025.0
    },
    "oversize": {
      "towing": 250.0,
      "ocean": 1000.0,
      "total": 1250.0
    }
  },
  "RICHMOND EAST - Virginia": {
    "regular": {
      "towing": 250.0,
      "ocean": 675.0,
      "total": 925.0
    },
    "large": {
      "towing": 250.0,
      "ocean": 775.0,
      "total": 1025.0
    },
    "oversize": {
      "towing": 250.0,
      "ocean": 1000.0,
      "total": 1250.0
    }
  },
  "ROCHESTER - New York": {
    "regular": {
      "towing": 450.0,
      "ocean": 700.0,
      "total": 1150.0
    },
    "large": {
      "towing": 450.0,
      "ocean": 800.0,
      "total": 1250.0
    },
    "oversize": {
      "towing": 450.0,
      "ocean": 1050.0,
      "total": 1500.0
    }
  },
  "RUTLAND - Vermont": {
    "regular": {
      "towing": 500.0,
      "ocean": 700.0,
      "total": 1200.0
    },
    "large": {
      "towing": 500.0,
      "ocean": 800.0,
      "total": 1300.0
    },
    "oversize": {
      "towing": 500.0,
      "ocean": 1050.0,
      "total": 1550.0
    }
  },
  "SACRAMENTO - California": {
    "regular": {
      "towing": 400.0,
      "ocean": 1200.0,
      "total": 1600.0
    },
    "large": {
      "towing": 400.0,
      "ocean": 1450.0,
      "total": 1850.0
    },
    "oversize": {
      "towing": 400.0,
      "ocean": 1700.0,
      "total": 2100.0
    }
  },
  "SALT LAKE CITY - Utah": {
    "regular": {
      "towing": 650.0,
      "ocean": 1200.0,
      "total": 1850.0
    },
    "large": {
      "towing": 650.0,
      "ocean": 1450.0,
      "total": 2100.0
    },
    "oversize": {
      "towing": 650.0,
      "ocean": 1700.0,
      "total": 2350.0
    }
  },
  "SALT LAKE CITY NORTH - Utah": {
    "regular": {
      "towing": 550.0,
      "ocean": 1200.0,
      "total": 1750.0
    },
    "large": {
      "towing": 550.0,
      "ocean": 1450.0,
      "total": 2000.0
    },
    "oversize": {
      "towing": 550.0,
      "ocean": 1700.0,
      "total": 2250.0
    }
  },
  "SAN ANTONIO - Texas": {
    "regular": {
      "towing": 300.0,
      "ocean": 750.0,
      "total": 1050.0
    },
    "large": {
      "towing": 300.0,
      "ocean": 850.0,
      "total": 1150.0
    },
    "oversize": {
      "towing": 300.0,
      "ocean": 1100.0,
      "total": 1400.0
    }
  },
  "SAN BERNARDINO - California": {
    "regular": {
      "towing": 200.0,
      "ocean": 1200.0,
      "total": 1400.0
    },
    "large": {
      "towing": 200.0,
      "ocean": 1450.0,
      "total": 1650.0
    },
    "oversize": {
      "towing": 200.0,
      "ocean": 1700.0,
      "total": 1900.0
    }
  },
  "SAN DIEGO - California": {
    "regular": {
      "towing": 300.0,
      "ocean": 1200.0,
      "total": 1500.0
    },
    "large": {
      "towing": 300.0,
      "ocean": 1450.0,
      "total": 1750.0
    },
    "oversize": {
      "towing": 300.0,
      "ocean": 1700.0,
      "total": 2000.0
    }
  },
  "SAN JOSE - California": {
    "regular": {
      "towing": 400.0,
      "ocean": 1200.0,
      "total": 1600.0
    },
    "large": {
      "towing": 400.0,
      "ocean": 1450.0,
      "total": 1850.0
    },
    "oversize": {
      "towing": 400.0,
      "ocean": 1700.0,
      "total": 2100.0
    }
  },
  "SAVANNAH - Georgia": {
    "regular": {
      "towing": 125.0,
      "ocean": 675.0,
      "total": 800.0
    },
    "large": {
      "towing": 125.0,
      "ocean": 775.0,
      "total": 900.0
    },
    "oversize": {
      "towing": 125.0,
      "ocean": 1000.0,
      "total": 1125.0
    }
  },
  "SAVANNAH / VERTIA SUBLOT-Georgia Copart - Georgia": {
    "regular": {
      "towing": 175.0,
      "ocean": 675.0,
      "total": 850.0
    },
    "large": {
      "towing": 175.0,
      "ocean": 775.0,
      "total": 950.0
    },
    "oversize": {
      "towing": 175.0,
      "ocean": 1000.0,
      "total": 1175.0
    }
  },
  "SC - COLUMBIA": {
    "regular": {
      "towing": 275.0,
      "ocean": 675.0,
      "total": 950.0
    },
    "large": {
      "towing": 275.0,
      "ocean": 775.0,
      "total": 1050.0
    },
    "oversize": {
      "towing": 275.0,
      "ocean": 1000.0,
      "total": 1275.0
    }
  },
  "SCRANTON - Pennsylvania": {
    "regular": {
      "towing": 275.0,
      "ocean": 700.0,
      "total": 975.0
    },
    "large": {
      "towing": 275.0,
      "ocean": 800.0,
      "total": 1075.0
    },
    "oversize": {
      "towing": 275.0,
      "ocean": 1050.0,
      "total": 1325.0
    }
  },
  "SEAFORD - Delaware": {
    "regular": {
      "towing": 325.0,
      "ocean": 700.0,
      "total": 1025.0
    },
    "large": {
      "towing": 325.0,
      "ocean": 800.0,
      "total": 1125.0
    },
    "oversize": {
      "towing": 325.0,
      "ocean": 1050.0,
      "total": 1375.0
    }
  },
  "SHREVEPORT - Louisiana": {
    "regular": {
      "towing": 315.0,
      "ocean": 750.0,
      "total": 1065.0
    },
    "large": {
      "towing": 315.0,
      "ocean": 850.0,
      "total": 1165.0
    },
    "oversize": {
      "towing": 315.0,
      "ocean": 1100.0,
      "total": 1415.0
    }
  },
  "SIKESTON - Missouri": {
    "regular": {
      "towing": 475.0,
      "ocean": 850.0,
      "total": 1325.0
    },
    "large": {
      "towing": 475.0,
      "ocean": 950.0,
      "total": 1425.0
    },
    "oversize": {
      "towing": 475.0,
      "ocean": 1250.0,
      "total": 1725.0
    }
  },
  "SO SACRAMENTO - California": {
    "regular": {
      "towing": 400.0,
      "ocean": 1200.0,
      "total": 1600.0
    },
    "large": {
      "towing": 400.0,
      "ocean": 1450.0,
      "total": 1850.0
    },
    "oversize": {
      "towing": 400.0,
      "ocean": 1700.0,
      "total": 2100.0
    }
  },
  "SOMERVILLE - New Jersey": {
    "regular": {
      "towing": 150.0,
      "ocean": 700.0,
      "total": 850.0
    },
    "large": {
      "towing": 150.0,
      "ocean": 800.0,
      "total": 950.0
    },
    "oversize": {
      "towing": 150.0,
      "ocean": 1050.0,
      "total": 1200.0
    }
  },
  "SOUTH BOSTON - Massachusetts": {
    "regular": {
      "towing": 375.0,
      "ocean": 700.0,
      "total": 1075.0
    },
    "large": {
      "towing": 375.0,
      "ocean": 800.0,
      "total": 1175.0
    },
    "oversize": {
      "towing": 375.0,
      "ocean": 1050.0,
      "total": 1425.0
    }
  },
  "Southern Illinois - Illinois": {
    "regular": {
      "towing": 575.0,
      "ocean": 675.0,
      "total": 1250.0
    },
    "large": {
      "towing": 575.0,
      "ocean": 775.0,
      "total": 1350.0
    },
    "oversize": {
      "towing": 575.0,
      "ocean": 1000.0,
      "total": 1575.0
    }
  },
  "SPANAWAY - Washington": {
    "regular": {
      "towing": 175.0,
      "ocean": 1625.0,
      "total": 1800.0
    },
    "large": {
      "towing": 175.0,
      "ocean": 1800.0,
      "total": 1975.0
    },
    "oversize": {
      "towing": 175.0,
      "ocean": 2200.0,
      "total": 2375.0
    }
  },
  "SPARTANBURG - South Carolina": {
    "regular": {
      "towing": 300.0,
      "ocean": 675.0,
      "total": 975.0
    },
    "large": {
      "towing": 300.0,
      "ocean": 775.0,
      "total": 1075.0
    },
    "oversize": {
      "towing": 300.0,
      "ocean": 1000.0,
      "total": 1300.0
    }
  },
  "SPOKANE - Washington": {
    "regular": {
      "towing": 350.0,
      "ocean": 1625.0,
      "total": 1975.0
    },
    "large": {
      "towing": 350.0,
      "ocean": 1800.0,
      "total": 2150.0
    },
    "oversize": {
      "towing": 350.0,
      "ocean": 2200.0,
      "total": 2550.0
    }
  },
  "SPRINGFIELD - Missouri": {
    "regular": {
      "towing": 625.0,
      "ocean": 675.0,
      "total": 1300.0
    },
    "large": {
      "towing": 625.0,
      "ocean": 775.0,
      "total": 1400.0
    },
    "oversize": {
      "towing": 625.0,
      "ocean": 1000.0,
      "total": 1625.0
    }
  },
  "ST. CLOUD - Minnesota": {
    "regular": {
      "towing": 500.0,
      "ocean": 850.0,
      "total": 1350.0
    },
    "large": {
      "towing": 500.0,
      "ocean": 950.0,
      "total": 1450.0
    },
    "oversize": {
      "towing": 500.0,
      "ocean": 1250.0,
      "total": 1750.0
    }
  },
  "ST. JOHN'S - Newfoundland and Lab": {
    "regular": {
      "towing": 1850.0,
      "ocean": 850.0,
      "total": 2700.0
    },
    "large": {
      "towing": 1850.0,
      "ocean": 950.0,
      "total": 2800.0
    },
    "oversize": {
      "towing": 1850.0,
      "ocean": 1250.0,
      "total": 3100.0
    }
  },
  "ST. LOUIS - Missouri": {
    "regular": {
      "towing": 575.0,
      "ocean": 675.0,
      "total": 1250.0
    },
    "large": {
      "towing": 575.0,
      "ocean": 775.0,
      "total": 1350.0
    },
    "oversize": {
      "towing": 575.0,
      "ocean": 1000.0,
      "total": 1575.0
    }
  },
  "SUN VALLEY - California": {
    "regular": {
      "towing": 200.0,
      "ocean": 1200.0,
      "total": 1400.0
    },
    "large": {
      "towing": 200.0,
      "ocean": 1450.0,
      "total": 1650.0
    },
    "oversize": {
      "towing": 200.0,
      "ocean": 1700.0,
      "total": 1900.0
    }
  },
  "SYRACUSE - New York": {
    "regular": {
      "towing": 350.0,
      "ocean": 700.0,
      "total": 1050.0
    },
    "large": {
      "towing": 350.0,
      "ocean": 800.0,
      "total": 1150.0
    },
    "oversize": {
      "towing": 350.0,
      "ocean": 1050.0,
      "total": 1400.0
    }
  },
  "TALLAHASSEE - Florida": {
    "regular": {
      "towing": 325.0,
      "ocean": 675.0,
      "total": 1000.0
    },
    "large": {
      "towing": 325.0,
      "ocean": 775.0,
      "total": 1100.0
    },
    "oversize": {
      "towing": 325.0,
      "ocean": 1000.0,
      "total": 1325.0
    }
  },
  "TAMPA NORTH - Florida": {
    "regular": {
      "towing": 325.0,
      "ocean": 750.0,
      "total": 1075.0
    },
    "large": {
      "towing": 325.0,
      "ocean": 850.0,
      "total": 1175.0
    },
    "oversize": {
      "towing": 325.0,
      "ocean": 1100.0,
      "total": 1425.0
    }
  },
  "TAMPA SOUTH - Florida": {
    "regular": {
      "towing": 275.0,
      "ocean": 750.0,
      "total": 1025.0
    },
    "large": {
      "towing": 275.0,
      "ocean": 850.0,
      "total": 1125.0
    },
    "oversize": {
      "towing": 275.0,
      "ocean": 1100.0,
      "total": 1375.0
    }
  },
  "TAMPA SOUTH - Mulberry Sublot": {
    "regular": {
      "towing": 275.0,
      "ocean": 750.0,
      "total": 1025.0
    },
    "large": {
      "towing": 275.0,
      "ocean": 850.0,
      "total": 1125.0
    },
    "oversize": {
      "towing": 275.0,
      "ocean": 1100.0,
      "total": 1375.0
    }
  },
  "TANNER - Alabama": {
    "regular": {
      "towing": 425.0,
      "ocean": 675.0,
      "total": 1100.0
    },
    "large": {
      "towing": 425.0,
      "ocean": 775.0,
      "total": 1200.0
    },
    "oversize": {
      "towing": 425.0,
      "ocean": 1000.0,
      "total": 1425.0
    }
  },
  "TIFTON - Georgia": {
    "regular": {
      "towing": 275.0,
      "ocean": 675.0,
      "total": 950.0
    },
    "large": {
      "towing": 275.0,
      "ocean": 775.0,
      "total": 1050.0
    },
    "oversize": {
      "towing": 275.0,
      "ocean": 1000.0,
      "total": 1275.0
    }
  },
  "TORONTO - Ontario": {
    "regular": {
      "towing": 225.0,
      "ocean": 850.0,
      "total": 1075.0
    },
    "large": {
      "towing": 225.0,
      "ocean": 950.0,
      "total": 1175.0
    },
    "oversize": {
      "towing": 225.0,
      "ocean": 1250.0,
      "total": 1475.0
    }
  },
  "TOW GUYS KAMUELA - Hawaii": {
    "regular": {
      "towing": 2300.0,
      "ocean": 1200.0,
      "total": 3500.0
    },
    "large": {
      "towing": 2300.0,
      "ocean": 1450.0,
      "total": 3750.0
    },
    "oversize": {
      "towing": 2300.0,
      "ocean": 1700.0,
      "total": 4000.0
    }
  },
  "TRENTON - New Jersey": {
    "regular": {
      "towing": 150.0,
      "ocean": 700.0,
      "total": 850.0
    },
    "large": {
      "towing": 150.0,
      "ocean": 800.0,
      "total": 950.0
    },
    "oversize": {
      "towing": 150.0,
      "ocean": 1050.0,
      "total": 1200.0
    }
  },
  "TUCSON - Arizona": {
    "regular": {
      "towing": 400.0,
      "ocean": 1200.0,
      "total": 1600.0
    },
    "large": {
      "towing": 400.0,
      "ocean": 1450.0,
      "total": 1850.0
    },
    "oversize": {
      "towing": 400.0,
      "ocean": 1700.0,
      "total": 2100.0
    }
  },
  "TULSA - Oklahoma": {
    "regular": {
      "towing": 475.0,
      "ocean": 750.0,
      "total": 1225.0
    },
    "large": {
      "towing": 475.0,
      "ocean": 850.0,
      "total": 1325.0
    },
    "oversize": {
      "towing": 475.0,
      "ocean": 1100.0,
      "total": 1575.0
    }
  },
  "VALLEJO - California": {
    "regular": {
      "towing": 400.0,
      "ocean": 1200.0,
      "total": 1600.0
    },
    "large": {
      "towing": 400.0,
      "ocean": 1450.0,
      "total": 1850.0
    },
    "oversize": {
      "towing": 400.0,
      "ocean": 1700.0,
      "total": 2100.0
    }
  },
  "VAN NUYS - California": {
    "regular": {
      "towing": 200.0,
      "ocean": 1200.0,
      "total": 1400.0
    },
    "large": {
      "towing": 200.0,
      "ocean": 1450.0,
      "total": 1650.0
    },
    "oversize": {
      "towing": 200.0,
      "ocean": 1700.0,
      "total": 1900.0
    }
  },
  "VINTON - Louisiana": {
    "regular": {
      "towing": 350.0,
      "ocean": 750.0,
      "total": 1100.0
    },
    "large": {
      "towing": 350.0,
      "ocean": 850.0,
      "total": 1200.0
    },
    "oversize": {
      "towing": 350.0,
      "ocean": 1100.0,
      "total": 1450.0
    }
  },
  "WACO - Texas": {
    "regular": {
      "towing": 325.0,
      "ocean": 750.0,
      "total": 1075.0
    },
    "large": {
      "towing": 325.0,
      "ocean": 850.0,
      "total": 1175.0
    },
    "oversize": {
      "towing": 325.0,
      "ocean": 1100.0,
      "total": 1425.0
    }
  },
  "WALTON - Kentucky": {
    "regular": {
      "towing": 550.0,
      "ocean": 675.0,
      "total": 1225.0
    },
    "large": {
      "towing": 550.0,
      "ocean": 775.0,
      "total": 1325.0
    },
    "oversize": {
      "towing": 550.0,
      "ocean": 1000.0,
      "total": 1550.0
    }
  },
  "WASHINGTON DC - Maryland": {
    "regular": {
      "towing": 300.0,
      "ocean": 675.0,
      "total": 975.0
    },
    "large": {
      "towing": 300.0,
      "ocean": 775.0,
      "total": 1075.0
    },
    "oversize": {
      "towing": 300.0,
      "ocean": 1000.0,
      "total": 1300.0
    }
  },
  "WAYLAND - Michigan": {
    "regular": {
      "towing": 400.0,
      "ocean": 850.0,
      "total": 1250.0
    },
    "large": {
      "towing": 400.0,
      "ocean": 950.0,
      "total": 1350.0
    },
    "oversize": {
      "towing": 400.0,
      "ocean": 1250.0,
      "total": 1650.0
    }
  },
  "WEST PALM BEACH - Florida": {
    "regular": {
      "towing": 170.0,
      "ocean": 750.0,
      "total": 920.0
    },
    "large": {
      "towing": 170.0,
      "ocean": 850.0,
      "total": 1020.0
    },
    "oversize": {
      "towing": 170.0,
      "ocean": 1100.0,
      "total": 1270.0
    }
  },
  "WEST WARREN - Massachusetts": {
    "regular": {
      "towing": 375.0,
      "ocean": 700.0,
      "total": 1075.0
    },
    "large": {
      "towing": 375.0,
      "ocean": 800.0,
      "total": 1175.0
    },
    "oversize": {
      "towing": 375.0,
      "ocean": 1050.0,
      "total": 1425.0
    }
  },
  "WHEELING - Illinois": {
    "regular": {
      "towing": 180.0,
      "ocean": 850.0,
      "total": 1030.0
    },
    "large": {
      "towing": 180.0,
      "ocean": 950.0,
      "total": 1130.0
    },
    "oversize": {
      "towing": 180.0,
      "ocean": 1250.0,
      "total": 1430.0
    }
  },
  "WICHITA - Kansas": {
    "regular": {
      "towing": 550.0,
      "ocean": 750.0,
      "total": 1300.0
    },
    "large": {
      "towing": 550.0,
      "ocean": 850.0,
      "total": 1400.0
    },
    "oversize": {
      "towing": 550.0,
      "ocean": 1100.0,
      "total": 1650.0
    }
  },
  "Windham - Maine": {
    "regular": {
      "towing": 500.0,
      "ocean": 700.0,
      "total": 1200.0
    },
    "large": {
      "towing": 500.0,
      "ocean": 800.0,
      "total": 1300.0
    },
    "oversize": {
      "towing": 500.0,
      "ocean": 1050.0,
      "total": 1550.0
    }
  },
  "YORK HAVEN - Pennsylvania": {
    "regular": {
      "towing": 275.0,
      "ocean": 700.0,
      "total": 975.0
    },
    "large": {
      "towing": 275.0,
      "ocean": 800.0,
      "total": 1075.0
    },
    "oversize": {
      "towing": 275.0,
      "ocean": 1050.0,
      "total": 1325.0
    }
  }
};
