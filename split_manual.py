import re

with open('frontend/src/App.jsx', 'r') as f:
    code = f.read()

manual_start = code.find('// ── TAB 4: Manual Parameter Test')
evac_start = code.find('// ── TAB 5: Nearby Facilities')

manual_code = code[manual_start:evac_start]

imports = """import React, { useState } from 'react';
import { Droplets, Mountain } from 'lucide-react';
import axios from 'axios';
import { getRiskColor, getRiskLabel, getRiskIcon, getRiskAdvice } from '../../utils/riskUtils';

const API_BASE = 'http://localhost:8000';

"""

with open('frontend/src/components/tabs/TabManualTest.jsx', 'w') as f:
    f.write(imports + manual_code.replace("function TabManualTest", "export default function TabManualTest"))
