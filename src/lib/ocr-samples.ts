// Preset sample document profiles for rapid demonstration & testing
export const SAMPLE_DOCUMENTS = {
  SAMPLE_NID: {
    id: "SAMPLE_NID",
    name: "National Smart Identity Card",
    docType: "NATIONAL_ID",
    imagePreview: "data:image/svg+xml;utf8," + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380">
        <defs>
          <linearGradient id="nidBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#064e3b" />
            <stop offset="50%" stop-color="#047857" />
            <stop offset="100%" stop-color="#065f46" />
          </linearGradient>
          <linearGradient id="chip" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f59e0b" />
            <stop offset="100%" stop-color="#d97706" />
          </linearGradient>
        </defs>
        <rect width="600" height="380" rx="20" fill="url(#nidBg)" stroke="#10b981" stroke-width="2"/>
        <circle cx="50" cy="50" r="26" fill="#ef4444" opacity="0.8"/>
        <text x="90" y="44" fill="#ffffff" font-size="16" font-weight="bold" font-family="sans-serif">PEOPLE'S REPUBLIC OF BANGLADESH</text>
        <text x="90" y="66" fill="#a7f3d0" font-size="13" font-family="sans-serif">National Identity Card / Smart NID</text>
        <rect x="50" y="90" width="60" height="46" rx="6" fill="url(#chip)" stroke="#b45309" stroke-width="1.5"/>
        <rect x="50" y="160" width="130" height="160" rx="10" fill="#022c22" stroke="#34d399" stroke-width="1"/>
        <circle cx="115" cy="220" r="34" fill="#10b981" opacity="0.5"/>
        <path d="M75 300 C80 260 150 260 155 300 Z" fill="#10b981" opacity="0.5"/>
        <text x="200" y="120" fill="#a7f3d0" font-size="11" font-family="sans-serif">Name (Legal)</text>
        <text x="200" y="142" fill="#ffffff" font-size="18" font-weight="bold" font-family="sans-serif">ARIF HASAN CHOWDHURY</text>
        <text x="200" y="175" fill="#a7f3d0" font-size="11" font-family="sans-serif">Father's Name</text>
        <text x="200" y="195" fill="#ffffff" font-size="14" font-weight="600" font-family="sans-serif">MD ANWAR HOSSAIN</text>
        <text x="200" y="225" fill="#a7f3d0" font-size="11" font-family="sans-serif">Mother's Name</text>
        <text x="200" y="245" fill="#ffffff" font-size="14" font-weight="600" font-family="sans-serif">SHAHANARA BEGUM</text>
        <text x="200" y="278" fill="#a7f3d0" font-size="11" font-family="sans-serif">Date of Birth</text>
        <text x="200" y="298" fill="#ffffff" font-size="14" font-weight="600" font-family="sans-serif">14 May 1995</text>
        <text x="360" y="278" fill="#a7f3d0" font-size="11" font-family="sans-serif">Gender</text>
        <text x="360" y="298" fill="#ffffff" font-size="14" font-weight="600" font-family="sans-serif">Male</text>
        <rect x="50" y="332" width="500" height="32" rx="6" fill="#022c22" opacity="0.7"/>
        <text x="65" y="354" fill="#34d399" font-size="15" font-family="monospace" font-weight="bold" letter-spacing="3">NID NO: 1995269150000089</text>
      </svg>
    `),
    extracted: {
      fullName: "ARIF HASAN CHOWDHURY",
      docNumber: "1995269150000089",
      dateOfBirth: "1995-05-14",
      gender: "Male",
      fatherName: "MD ANWAR HOSSAIN",
      motherName: "SHAHANARA BEGUM",
      address: "House 34, Road 11, Sector 4, Uttara, Dhaka 1230",
      expiryDate: "2035-12-31",
      nationality: "Bangladeshi",
      taxId: "TIN-8891-4402-91",
    },
    confidence: 97.8,
  },
  SAMPLE_PASSPORT: {
    id: "SAMPLE_PASSPORT",
    name: "Biometric International Passport",
    docType: "PASSPORT",
    imagePreview: "data:image/svg+xml;utf8," + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380">
        <defs>
          <linearGradient id="passBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e1b4b" />
            <stop offset="50%" stop-color="#312e81" />
            <stop offset="100%" stop-color="#1e1b4b" />
          </linearGradient>
        </defs>
        <rect width="600" height="380" rx="16" fill="url(#passBg)" stroke="#6366f1" stroke-width="2"/>
        <text x="40" y="45" fill="#e0e7ff" font-size="14" font-weight="bold" font-family="sans-serif">PASSPORT / PASSEPORT</text>
        <text x="380" y="45" fill="#facc15" font-size="15" font-weight="bold" font-family="sans-serif">UNITED STATES OF AMERICA</text>
        <rect x="40" y="70" width="130" height="165" rx="8" fill="#0f172a" stroke="#818cf8" stroke-width="1.5"/>
        <circle cx="105" cy="130" r="34" fill="#6366f1" opacity="0.6"/>
        <path d="M65 210 C70 175 140 175 145 210 Z" fill="#6366f1" opacity="0.6"/>
        <text x="195" y="90" fill="#a5b4fc" font-size="10" font-family="sans-serif">Type / Code</text>
        <text x="195" y="108" fill="#ffffff" font-size="13" font-family="sans-serif">P &lt; USA</text>
        <text x="350" y="90" fill="#a5b4fc" font-size="10" font-family="sans-serif">Passport No.</text>
        <text x="350" y="110" fill="#facc15" font-size="16" font-weight="bold" font-family="monospace">A29384719</text>
        <text x="195" y="138" fill="#a5b4fc" font-size="10" font-family="sans-serif">Surname</text>
        <text x="195" y="158" fill="#ffffff" font-size="16" font-weight="bold" font-family="sans-serif">SULTANA</text>
        <text x="195" y="185" fill="#a5b4fc" font-size="10" font-family="sans-serif">Given Names</text>
        <text x="195" y="205" fill="#ffffff" font-size="16" font-weight="bold" font-family="sans-serif">NUSRAT JAHAN</text>
        <text x="195" y="232" fill="#a5b4fc" font-size="10" font-family="sans-serif">Nationality</text>
        <text x="195" y="250" fill="#ffffff" font-size="13" font-family="sans-serif">UNITED STATES CITIZEN</text>
        <text x="350" y="232" fill="#a5b4fc" font-size="10" font-family="sans-serif">Date of Birth</text>
        <text x="350" y="250" fill="#ffffff" font-size="13" font-family="sans-serif">28 SEP 1996</text>
        <text x="480" y="232" fill="#a5b4fc" font-size="10" font-family="sans-serif">Sex</text>
        <text x="480" y="250" fill="#ffffff" font-size="13" font-family="sans-serif">Female</text>
        <rect x="30" y="300" width="540" height="60" rx="6" fill="#0f172a" stroke="#3730a3" stroke-width="1"/>
        <text x="40" y="325" fill="#818cf8" font-size="13" font-family="monospace">P&lt;USASULTANA&lt;&lt;NUSRAT&lt;JAHAN&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
        <text x="40" y="348" fill="#818cf8" font-size="13" font-family="monospace">A293847190USA9609282F3108257&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;04</text>
      </svg>
    `),
    extracted: {
      fullName: "NUSRAT JAHAN SULTANA",
      docNumber: "A29384719",
      dateOfBirth: "1996-09-28",
      gender: "Female",
      fatherName: "MOHAMMAD ZAHIR SULTAN",
      motherName: "ROZINA AKTER",
      address: "742 Evergreen Boulevard, Austin, TX 78701",
      expiryDate: "2031-08-25",
      nationality: "American",
      taxId: "SSN-984-21-4491",
    },
    confidence: 99.1,
  },
  SAMPLE_DRIVING_LICENSE: {
    id: "SAMPLE_DRIVING_LICENSE",
    name: "Department of Transportation Driver License",
    docType: "DRIVING_LICENSE",
    imagePreview: "data:image/svg+xml;utf8," + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380">
        <defs>
          <linearGradient id="dlBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a" />
            <stop offset="50%" stop-color="#1e293b" />
            <stop offset="100%" stop-color="#0f172a" />
          </linearGradient>
        </defs>
        <rect width="600" height="380" rx="16" fill="url(#dlBg)" stroke="#38bdf8" stroke-width="2"/>
        <rect x="0" y="0" width="600" height="50" rx="16" fill="#0284c7" />
        <text x="30" y="33" fill="#ffffff" font-size="16" font-weight="bold" font-family="sans-serif">STATE DRIVER LICENSE / IDENTIFICATION</text>
        <rect x="40" y="75" width="130" height="160" rx="8" fill="#020617" stroke="#38bdf8" stroke-width="1"/>
        <circle cx="105" cy="135" r="32" fill="#38bdf8" opacity="0.5"/>
        <path d="M68 215 C75 180 135 180 142 215 Z" fill="#38bdf8" opacity="0.5"/>
        <text x="195" y="90" fill="#94a3b8" font-size="11" font-family="sans-serif">License Number (DL)</text>
        <text x="195" y="112" fill="#38bdf8" font-size="18" font-weight="bold" font-family="monospace">DL-8491823901</text>
        <text x="195" y="145" fill="#94a3b8" font-size="11" font-family="sans-serif">Name</text>
        <text x="195" y="168" fill="#ffffff" font-size="17" font-weight="bold" font-family="sans-serif">TANVIR AHMED RAHMAN</text>
        <text x="195" y="200" fill="#94a3b8" font-size="11" font-family="sans-serif">Address</text>
        <text x="195" y="220" fill="#e2e8f0" font-size="13" font-family="sans-serif">55 Tech Valley Way, San Jose, CA 95110</text>
        <text x="195" y="255" fill="#94a3b8" font-size="11" font-family="sans-serif">DOB: 1991-03-22</text>
        <text x="330" y="255" fill="#94a3b8" font-size="11" font-family="sans-serif">EXP: 2029-03-22</text>
        <text x="460" y="255" fill="#94a3b8" font-size="11" font-family="sans-serif">SEX: M</text>
        <rect x="40" y="295" width="520" height="60" rx="6" fill="#020617" stroke="#334155" stroke-width="1"/>
        <text x="60" y="332" fill="#38bdf8" font-size="14" font-family="monospace" letter-spacing="4">USA*DL8491823901&lt;CLASS*C&lt;REST*NONE</text>
      </svg>
    `),
    extracted: {
      fullName: "TANVIR AHMED RAHMAN",
      docNumber: "DL-8491823901",
      dateOfBirth: "1991-03-22",
      gender: "Male",
      fatherName: "KHALILUR RAHMAN",
      motherName: "MAHMUDA BEGUM",
      address: "55 Tech Valley Way, San Jose, CA 95110",
      expiryDate: "2029-03-22",
      nationality: "American",
      taxId: "TIN-990-11-2847",
    },
    confidence: 96.5,
  },
};
