// src/EasyMateri7.js
import React, { useState, useMemo, useCallback } from "react";

// =================================================================
// 1. DATA - chapterData & correctAnswers
// =================================================================

const chapterData = [
  {
    num: 0,
    icon: "✨",
    title: "Chapter 0",
    subtitle: "The Beginning",
    description:
      "Materi dasar Bahasa Inggris: Mengenal Alfabet, Angka, Hari, Bulan, dan Salam (Greetings).",
    topics: ["Alphabets", "Numbers", "Greetings"],
    colors: {
      primary: "bg-indigo-500",
      secondary: "bg-purple-600",
      gradient: "from-[#5e60ce] to-[#8758ff]",
      text: "text-indigo-600",
      border: "border-indigo-500",
    },
  },
  {
    num: 1,
    icon: "👤",
    title: "Chapter 1",
    subtitle: "About Me",
    description:
      "Belajar cara memperkenalkan diri, mendeskripsikan hobi, dan menggambarkan teman-temanmu dalam Bahasa Inggris.",
    topics: ["Self Introduction", "Hobbies", "Describing People"],
    colors: {
      primary: "bg-blue-600",
      secondary: "bg-purple-700",
      gradient: "from-[#667eea] to-[#764ba2]",
      text: "text-blue-600",
      border: "border-blue-600",
    },
  },
  {
    num: 2,
    icon: "🍜",
    title: "Chapter 2",
    subtitle: "Culinary and Me",
    description:
      "Pelajari cara mendeskripsikan makanan favorit dan menulis resep dalam Bahasa Inggris.",
    topics: ["Food Vocabulary", "Recipe", "Procedure Text"],
    colors: {
      primary: "bg-pink-400",
      secondary: "bg-red-500",
      gradient: "from-[#f093fb] to-[#f5576c]",
      text: "text-pink-600",
      border: "border-pink-500",
    },
  },
  {
    num: 3,
    icon: "🏠",
    title: "Chapter 3",
    subtitle: "Home Sweet Home",
    description:
      "Deskripsikan rumahmu, ruangan favorit, dan pekerjaan rumah tangga dalam Bahasa Inggris.",
    topics: ["House & Rooms", "Prepositions", "Instructions"],
    colors: {
      primary: "bg-sky-400",
      secondary: "bg-cyan-500",
      gradient: "from-[#4facfe] to-[#00f2fe]",
      text: "text-sky-600",
      border: "border-sky-500",
    },
  },
  {
    num: 4,
    icon: "📚",
    title: "Chapter 4",
    subtitle: "My School Activities",
    description:
      "Ceritakan jadwal sekolah, kelas online, dan kebiasaan belajarmu.",
    topics: ["School Subjects", "Daily Routine", "Time Expressions"],
    colors: {
      primary: "bg-emerald-400",
      secondary: "bg-teal-500",
      gradient: "from-[#43e97b] to-[#38f9d7]",
      text: "text-emerald-600",
      border: "border-emerald-500",
    },
  },
  {
    num: 5,
    icon: "🏫",
    title: "Chapter 5",
    subtitle: "This is My School",
    description:
      "Jelaskan fasilitas sekolah, kegiatan ekstrakurikuler, dan acara sekolah.",
    topics: ["School Facilities", "Extracurricular", "Recount Text"],
    colors: {
      primary: "bg-yellow-400",
      secondary: "bg-orange-500",
      gradient: "from-[#fa709a] to-[#fee140]",
      text: "text-yellow-600",
      border: "border-yellow-500",
    },
  },
];

const correctAnswers = {
  0: { 1: "A", 2: "B", 3: "B", 4: "B" },
  1: {
    1: "B",
    2: "B",
    3: "B",
    4: "D",
    5: "C",
    6: "B",
    7: "D",
    8: "B",
    9: "C",
    10: "C",
  },
  2: { 1: "B", 2: "B", 3: "C", 4: "D" },
};

const quizQuestionsMap = {
  0: [
    {
      id: 1,
      text: "1. What is the spelling for the letter 'U'?",
      options: ["A. /yu:/", "B. /ju:/", "C. /ou/", "D. /i:/"],
    },
    {
      id: 2,
      text: "2. Which word is a Cardinal Number?",
      options: ["A. Second", "B. Twelve", "C. Tenth", "D. Fifth"],
    },
    {
      id: 3,
      text: "3. If today is Monday, what day is tomorrow?",
      options: ["A. Sunday", "B. Tuesday", "C. Thursday", "D. Friday"],
    },
    {
      id: 4,
      text: "4. What do you say when you want your friend to stop talking?",
      options: [
        "A. Stand up!",
        "B. Listen to me!",
        "C. Open your book!",
        "D. Good afternoon!",
      ],
    },
  ],
  1: [
    {
      id: 1,
      text: '1. "My name _____ Siti and I _____ from Jakarta."',
      options: ["A. am / is", "B. is / am", "C. are / am", "D. am / are"],
    },
    {
      id: 2,
      text: '2. "She _____ playing badminton every Sunday."',
      options: ["A. like", "B. likes", "C. liking", "D. to like"],
    },
    {
      id: 3,
      text: "3. Which sentence is correct?",
      options: [
        "A. He have long hair",
        "B. He has long hair",
        "C. He having long hair",
        "D. He is have long hair",
      ],
    },
    {
      id: 4,
      text: '4. "I _____ go to the library. I go there every day."',
      options: ["A. never", "B. rarely", "C. sometimes", "D. always"],
    },
    {
      id: 5,
      text: "5. What is the correct order for describing a person?",
      options: [
        "A. Personality - Identification - Physical appearance",
        "B. Physical appearance - Identification - Personality",
        "C. Identification - Physical appearance - Personality",
        "D. Identification - Personality - Physical appearance",
      ],
    },
    {
      id: 6,
      text: '6. "My sister is very _____. She always helps people."',
      options: ["A. tall", "B. kind", "C. curly", "D. short"],
    },
    {
      id: 7,
      text: "7. Choose the sentence with the correct Simple Present Tense:",
      options: [
        "A. They doesn't like Math",
        "B. She don't likes English",
        "C. He doesn't likes music",
        "D. We don't like swimming",
      ],
    },
    {
      id: 8,
      text: '8. "_____ is your hobby?" - "I like reading books."',
      options: ["A. Who", "B. What", "C. Where", "D. When"],
    },
    {
      id: 9,
      text: "9. Which word describes physical appearance?",
      options: ["A. friendly", "B. smart", "C. tall", "D. kind"],
    },
    {
      id: 10,
      text: '10. "In my free time, I _____ play video games with my brother."',
      options: ["A. am", "B. is", "C. often", "D. have"],
    },
  ],
  2: [
    {
      id: 1,
      text: "1. Choose the correct imperative sentence for a recipe.",
      options: [
        "A. She mixes the flour",
        "B. Mix the flour",
        "C. They mixing the flour",
        "D. To mix the flour",
      ],
    },
    {
      id: 2,
      text: "2. After heating the water, _____ add the noodles.",
      options: ["A. Finally", "B. Then", "C. First", "D. Goal"],
    },
    {
      id: 3,
      text: "3. Chili is very _____. It makes my mouth burn.",
      options: ["A. sweet", "B. sour", "C. spicy", "D. salty"],
    },
    {
      id: 4,
      text: "4. Which part lists the tools and items needed?",
      options: ["A. Steps", "B. Goal", "C. Conclusion", "D. Ingredients"],
    },
  ],
};

// =================================================================
// 2. HELPER COMPONENTS (BOXES, TABS, CARDS)
// =================================================================

const TabButton = ({ isActive, onClick, colors, icon, children }) => (
  <button
    className={`flex-1 min-w-[150px] px-5 py-3 rounded-xl font-bold transition duration-300 shadow-md ${
      isActive
        ? `text-white bg-gradient-to-r ${colors.gradient}`
        : `bg-white ${colors.text} hover:shadow-lg`
    }`}
    onClick={onClick}>
    {icon} {children}
  </button>
);

const Box = ({
  children,
  className = "",
  style = {},
  title,
  borderColor,
  titleStyle = "text-xl font-bold",
}) => (
  <div
    className={`p-6 rounded-xl my-4 border-l-4 shadow-sm ${className}`}
    style={{ borderColor: borderColor, ...style }}>
    {title && <h4 className={`mb-3 ${titleStyle}`}>{title}</h4>}
    {children}
  </div>
);

const InfoBox = ({ children, borderColor = "#667eea", title, titleStyle }) => (
  <Box
    className="bg-blue-50"
    style={{ borderColor }}
    title={title}
    titleStyle={titleStyle}>
    {children}
  </Box>
);

const ExampleBox = ({ children, title = "📝 Example", titleStyle }) => (
  <Box
    className="bg-yellow-50"
    style={{ borderColor: "#ffc107" }}
    title={title}
    titleStyle={titleStyle}>
    {children}
  </Box>
);

const PracticeBox = ({ children, title = "✍️ Practice", titleStyle }) => (
  <Box
    className="bg-emerald-50"
    style={{ borderColor: "#43e97b" }}
    title={title}
    titleStyle={titleStyle}>
    {children}
  </Box>
);

const ChapterCard = ({ chapter, onClick }) => {
  const { num, icon, title, subtitle, description, topics, colors } = chapter;
  const borderGradientClass = colors.gradient;

  return (
    <div
      className="bg-white p-8 rounded-2xl cursor-pointer shadow-xl transition duration-500 ease-in-out hover:-translate-y-2 hover:shadow-2xl relative overflow-hidden"
      onClick={() => onClick(num)}>
      <div
        className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${borderGradientClass}`}></div>

      <span className="text-4xl block mb-4">{icon}</span>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
      <p className="text-lg font-semibold text-gray-600 mb-3">{subtitle}</p>

      <p className="text-gray-500 line-clamp-3 mb-4">{description}</p>

      <div className="flex flex-wrap gap-2 mt-4">
        {topics.map((topic, index) => (
          <span
            key={index}
            className={`px-3 py-1 text-sm rounded-full ${colors.text} bg-opacity-10 bg-current font-medium`}
            style={{ backgroundColor: `rgba(102, 126, 234, 0.1)` }} // Fallback/default blue tint
          >
            {topic}
          </span>
        ))}
      </div>
    </div>
  );
};

const QuizQuestion = ({
  question,
  chapterNum,
  selectedOption,
  onSelectOption,
  isSubmitted,
  correctAnswer,
}) => {
  const questionId = question.id;

  return (
    <div className="bg-white p-6 rounded-xl mb-4 border-l-4 border-indigo-500 shadow-md">
      <p className="text-lg font-semibold mb-4 text-gray-800">
        {question.text}
      </p>
      <div className="flex flex-col space-y-2">
        {question.options.map((optionText, index) => {
          const optionLetter = optionText.charAt(0);
          const isSelected = selectedOption === optionLetter;
          const isCorrect = isSubmitted && optionLetter === correctAnswer;
          const isWrong =
            isSubmitted && isSelected && optionLetter !== correctAnswer;

          let btnClass =
            "px-4 py-3 rounded-lg text-left transition duration-200 border-2 border-gray-200 hover:border-indigo-400";
          if (isSubmitted) {
            if (isCorrect) {
              btnClass =
                "px-4 py-3 rounded-lg text-left bg-emerald-500 text-white border-2 border-emerald-500 shadow-lg cursor-not-allowed";
            } else if (isWrong) {
              btnClass =
                "px-4 py-3 rounded-lg text-left bg-red-500 text-white border-2 border-red-500 shadow-lg cursor-not-allowed";
            } else {
              btnClass =
                "px-4 py-3 rounded-lg text-left border-2 border-gray-200 text-gray-500 cursor-not-allowed";
            }
          } else if (isSelected) {
            btnClass =
              "px-4 py-3 rounded-lg text-left bg-indigo-500 text-white border-2 border-indigo-500 shadow-md";
          }

          return (
            <button
              key={index}
              className={btnClass}
              onClick={() =>
                !isSubmitted && onSelectOption(questionId, optionLetter)
              }
              disabled={isSubmitted}>
              {optionText}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// =================================================================
// 3. CHAPTER CONTENT COMPONENTS
// =================================================================

const ChapterContentMap = {};

// --- Chapter 0 Content ---
ChapterContentMap[0] = ({
  chapter,
  colors,
  quizState,
  handleQuizAction,
  practiceState,
  handlePracticeAction,
}) => {
  const [activeTab, setActiveTab] = useState("theory");
  const { answers, isSubmitted, result } = quizState;

  const renderTheory = () => (
    <>
      <h2 className="text-3xl font-bold mb-6">📚 Chapter 0: The Beginning</h2>

      <InfoBox title="🎯 Learning Objectives" borderColor={colors.border}>
        <p>Setelah mempelajari chapter ini, kamu akan bisa:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li>
            Menyebutkan dan mengeja alfabet, angka, hari, dan bulan dalam Bahasa
            Inggris
          </li>
          <li>Mengucapkan salam (greetings) dan perpisahan (parting)</li>
          <li>
            Memberikan dan memahami instruksi sederhana di kelas (simple
            instructions)
          </li>
        </ul>
      </InfoBox>

      <h3 className="text-2xl font-semibold mt-8 mb-4">
        Unit 1: English Alphabets and Numbers
      </h3>
      <InfoBox borderColor={colors.border}>
        <h4 className="text-xl font-bold mb-2">A. The Alphabet:</h4>
        <p>
          Sangat penting untuk tahu cara pengucapan setiap huruf (spelling).
          Contoh: 'B' dibaca /bi:/, 'W' dibaca /'dʌbəl ju:/. (Coba cari audio
          pronunciation di Google ya!)
        </p>

        <h4 className="text-xl font-bold mt-5 mb-2">B. Numbers:</h4>
        <p>
          <strong>Cardinal Numbers (Jumlah):</strong> One, Two, Three, ...
          Twelve, Twenty, One hundred. (Contoh: I have two brothers)
        </p>
        <p>
          <strong>Ordinal Numbers (Urutan):</strong> First (1st), Second (2nd),
          Third (3rd), Fourth (4th), Fifth (5th). (Contoh: I am the first
          winner)
        </p>
      </InfoBox>

      <ExampleBox>
        <p>
          <strong>Spelling:</strong> How do you spell 'apple'?{" "}
          <span className="bg-yellow-300 px-1 rounded-sm font-semibold">
            A-P-P-L-E
          </span>
          .
        </p>
        <p>
          <strong>Numbers:</strong> My brother has{" "}
          <span className="bg-yellow-300 px-1 rounded-sm font-semibold">
            three
          </span>{" "}
          books. (Cardinal)
        </p>
        <p>
          I am the{" "}
          <span className="bg-yellow-300 px-1 rounded-sm font-semibold">
            first
          </span>{" "}
          winner in the competition. (Ordinal)
        </p>
      </ExampleBox>

      <h3 className="text-2xl font-semibold mt-8 mb-4">
        Unit 2: Greetings, Days, and Time
      </h3>
      <InfoBox borderColor={colors.border}>
        <h4 className="text-xl font-bold mb-2">A. Greetings (Salam):</h4>
        <ul className="list-disc ml-5 space-y-1">
          <li>Good morning (00:00 - 12:00)</li>
          <li>Good afternoon (12:00 - 18:00)</li>
          <li>Good evening (18:00 - 00:00)</li>
          <li>
            Good night (Diucapkan saat akan tidur atau berpisah di malam hari)
          </li>
        </ul>

        <h4 className="text-xl font-bold mt-5 mb-2">B. Days of the Week:</h4>
        <p>Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday.</p>

        <h4 className="text-xl font-bold mt-5 mb-2">C. Months of the Year:</h4>
        <p>
          January, February, March, April, May, June, July, August, September,
          October, November, December.
        </p>
      </InfoBox>

      <h3 className="text-2xl font-semibold mt-8 mb-4">
        Unit 3: Simple Instructions (Instruksi Sederhana)
      </h3>
      <PracticeBox title="Common Classroom Instructions:">
        <ul className="list-disc ml-5 space-y-1">
          <li>
            <span className="bg-yellow-300 px-1 rounded-sm font-semibold">
              Open your book.
            </span>{" "}
            (Buka bukumu)
          </li>
          <li>
            <span className="bg-yellow-300 px-1 rounded-sm font-semibold">
              Close the door.
            </span>{" "}
            (Tutup pintunya)
          </li>
          <li>
            <span className="bg-yellow-300 px-1 rounded-sm font-semibold">
              Stand up / Sit down.
            </span>{" "}
            (Berdiri / Duduk)
          </li>
          <li>
            <span className="bg-yellow-300 px-1 rounded-sm font-semibold">
              Listen to me.
            </span>{" "}
            (Dengarkan saya)
          </li>
          <li>
            <span className="bg-yellow-300 px-1 rounded-sm font-semibold">
              Pay attention.
            </span>{" "}
            (Perhatikan)
          </li>
        </ul>
      </PracticeBox>
    </>
  );

  const renderExamples = () => (
    <>
      <h2 className="text-3xl font-bold mb-6">📖 Examples & Dialogues</h2>
      <ExampleBox title="Example 1: Greeting and Spelling">
        <div className="bg-white p-5 rounded-lg shadow-inner">
          <p>
            <strong>Teacher:</strong> Good morning, class!
          </p>
          <p>
            <strong>Students:</strong> Good morning, Ma'am.
          </p>
          <p>
            <strong>Teacher:</strong> Please, stand up and greet your friends.
            You can sit down now. Thank you.
          </p>
          <p className="mt-4">
            <strong>Ayu:</strong> Hello, my name is Ayu.
          </p>
          <p>
            <strong>Bima:</strong> Hi Ayu! I am Bima. How do you spell your
            name?
          </p>
          <p>
            <strong>Ayu:</strong> It is{" "}
            <span className="bg-yellow-300 px-1 rounded-sm font-semibold">
              A-Y-U
            </span>
            .
          </p>
        </div>
      </ExampleBox>
      <ExampleBox title="Example 2: Numbers and Time">
        <div className="bg-white p-5 rounded-lg shadow-inner">
          <p>
            <strong>Rani:</strong> Look! There are{" "}
            <span className="bg-yellow-300 px-1 rounded-sm font-semibold">
              ten
            </span>{" "}
            beautiful flowers.
          </p>
          <p>
            <strong>Sinta:</strong> Wow, you are right! What day is today?
          </p>
          <p>
            <strong>Rani:</strong> Today is{" "}
            <span className="bg-yellow-300 px-1 rounded-sm font-semibold">
              Monday
            </span>
            , the{" "}
            <span className="bg-yellow-300 px-1 rounded-sm font-semibold">
              third
            </span>{" "}
            of{" "}
            <span className="bg-yellow-300 px-1 rounded-sm font-semibold">
              November
            </span>
            .
          </p>
          <p>
            <strong>Sinta:</strong> What time is it now?
          </p>
          <p>
            <strong>Rani:</strong> It is{" "}
            <span className="bg-yellow-300 px-1 rounded-sm font-semibold">
              seven o'clock
            </span>{" "}
            in the morning.
          </p>
        </div>
      </ExampleBox>
    </>
  );

  const renderPractice = () => (
    <>
      <h2 className="text-3xl font-bold mb-6">✍️ Simple Practice</h2>
      <PracticeBox title="📝 Task 1: Complete the Greetings">
        <p className="mb-4">
          Isilah bagian kosong dengan kata yang tepat (Good morning, Good
          afternoon, Good evening, Good night).
        </p>
        <p className="mt-4">1. It is 06:30 AM. You say: ___________</p>
        <p>2. It is 03:00 PM. You say: ___________</p>
        <p>3. It is 07:45 PM. You say: ___________</p>
        <p>4. You are going to sleep. You say: ___________</p>
        <textarea
          id="practice0-1"
          className="w-full min-h-[150px] p-4 border-2 border-gray-300 rounded-xl mt-4 focus:outline-none focus:border-indigo-500 transition"
          placeholder="Write your answers here."
          value={practiceState[0]?.[1] || ""}
          onChange={(e) =>
            handlePracticeAction(0, 1, "update", e.target.value)
          }></textarea>
        <div className="flex gap-3 mt-4">
          <button
            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md transition hover:bg-indigo-700"
            onClick={() => handlePracticeAction(0, 1, "check")}>
            🔍 Check
          </button>
          <button
            className="px-6 py-3 bg-gray-200 text-indigo-600 font-bold rounded-lg shadow-md transition hover:bg-gray-300"
            onClick={() => handlePracticeAction(0, 1, "clear")}>
            🗑️ Clear
          </button>
        </div>
        {practiceState[0]?.[1]?.feedback && (
          <div
            className="mt-4"
            dangerouslySetInnerHTML={{
              __html: practiceState[0][1].feedback,
            }}></div>
        )}
      </PracticeBox>
    </>
  );

  const renderQuiz = () => (
    <>
      <h2 className="text-3xl font-bold mb-6">🎯 Quiz Time!</h2>
      <p className="mb-6">
        Uji pemahamanmu tentang Chapter 0! Pilih jawaban yang paling tepat.
      </p>
      <div className="space-y-4">
        {quizQuestionsMap[0].map((q) => (
          <QuizQuestion
            key={q.id}
            question={q}
            chapterNum={0}
            selectedOption={answers[q.id]}
            onSelectOption={(qId, option) =>
              handleQuizAction(0, "select", qId, option)
            }
            isSubmitted={isSubmitted}
            correctAnswer={correctAnswers[0]?.[q.id]}
          />
        ))}
      </div>
      {!isSubmitted && (
        <button
          className="mt-6 px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl shadow-lg transition hover:shadow-xl"
          onClick={() => handleQuizAction(0, "submit")}>
          Submit Quiz
        </button>
      )}
      {result && (
        <div
          className={`mt-6 p-6 rounded-xl border-l-4 ${result.bgColor}`}
          style={{ borderColor: result.borderColor }}>
          <div dangerouslySetInnerHTML={{ __html: result.message }}></div>
        </div>
      )}
    </>
  );

  return (
    <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-xl min-h-[500px]">
      <div className="flex gap-4 mb-6 flex-wrap">
        <TabButton
          isActive={activeTab === "theory"}
          onClick={() => setActiveTab("theory")}
          colors={colors}
          icon="📚">
          Theory
        </TabButton>
        <TabButton
          isActive={activeTab === "examples"}
          onClick={() => setActiveTab("examples")}
          colors={colors}
          icon="📖">
          Examples
        </TabButton>
        <TabButton
          isActive={activeTab === "practice"}
          onClick={() => setActiveTab("practice")}
          colors={colors}
          icon="✍️">
          Practice
        </TabButton>
        <TabButton
          isActive={activeTab === "quiz"}
          onClick={() => setActiveTab("quiz")}
          colors={colors}
          icon="🎯">
          Quiz
        </TabButton>
      </div>
      <div>
        {activeTab === "theory" && renderTheory()}
        {activeTab === "examples" && renderExamples()}
        {activeTab === "practice" && renderPractice()}
        {activeTab === "quiz" && renderQuiz()}
      </div>
    </div>
  );
};
// --- End Chapter 0 Content ---

// --- Chapter 1 Content (Simplified/Structural) ---
ChapterContentMap[1] = ({
  chapter,
  colors,
  quizState,
  handleQuizAction,
  practiceState,
  handlePracticeAction,
}) => {
  const [activeTab, setActiveTab] = useState("theory");
  const { answers, isSubmitted, result } = quizState;

  const renderTheory = () => (
    <>
      <h2 className="text-3xl font-bold mb-6">📚 Chapter 1: About Me</h2>
      <InfoBox title="🎯 Learning Objectives" borderColor={colors.border}>
        <p>Setelah mempelajari chapter ini, kamu akan bisa:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Memperkenalkan diri dalam Bahasa Inggris</li>
          <li>Menjelaskan hobi dan kesukaanmu</li>
          <li>Mendeskripsikan penampilan dan kepribadian seseorang</li>
          <li>Menggunakan Simple Present Tense dengan benar</li>
        </ul>
      </InfoBox>

      <h3 className="text-2xl font-semibold mt-8 mb-4">
        Unit 1: Self Introduction
      </h3>
      <InfoBox borderColor={colors.border}>
        Key Expressions: My name is..., I am... years old, I live in...
      </InfoBox>
      <h3 className="text-2xl font-semibold mt-8 mb-4">
        Unit 2: Hobbies and Interests
      </h3>
      <InfoBox borderColor={colors.border}>
        Key Expressions: I like..., My hobby is..., Frequency Adverbs (always,
        usually).
      </InfoBox>
      <h3 className="text-2xl font-semibold mt-8 mb-4">
        Unit 3: Describing People
      </h3>
      <ExampleBox>
        Physical Appearance (tall, short, slim) & Personality (kind, friendly,
        smart).
      </ExampleBox>
      <h3 className="text-2xl font-semibold mt-8 mb-4">
        Grammar Focus: Simple Present Tense
      </h3>
      <InfoBox borderColor={colors.border}>
        Formula: With "to be" (am/is/are) and With verbs (verb or verb+s/es).
      </InfoBox>
    </>
  );

  const renderPractice = () => (
    <>
      <h2 className="text-3xl font-bold mb-6">✍️ Writing Practice</h2>
      <PracticeBox title="📝 Task 1: Write Your Self Introduction">
        <p className="mb-4">
          Tulislah perkenalan dirimu sendiri! Minimal 5-7 kalimat.
        </p>
        <textarea
          className="w-full min-h-[150px] p-4 border-2 border-gray-300 rounded-xl mt-4 focus:outline-none focus:border-indigo-500 transition"
          placeholder="Start writing here..."
          value={practiceState[1]?.[1] || ""}
          onChange={(e) =>
            handlePracticeAction(1, 1, "update", e.target.value)
          }></textarea>
        <div className="flex gap-3 mt-4">
          <button
            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md transition hover:bg-indigo-700"
            onClick={() => handlePracticeAction(1, 1, "check")}>
            🔍 Check
          </button>
          <button
            className="px-6 py-3 bg-gray-200 text-indigo-600 font-bold rounded-lg shadow-md transition hover:bg-gray-300"
            onClick={() => handlePracticeAction(1, 1, "clear")}>
            🗑️ Clear
          </button>
        </div>
        {practiceState[1]?.[1]?.feedback && (
          <div
            className="mt-4"
            dangerouslySetInnerHTML={{
              __html: practiceState[1][1].feedback,
            }}></div>
        )}
      </PracticeBox>
    </>
  );

  const renderQuiz = () => (
    <>
      <h2 className="text-3xl font-bold mb-6">🎯 Quiz Time!</h2>
      <p className="mb-6">
        Uji pemahamanmu tentang Chapter 1! Pilih jawaban yang paling tepat.
      </p>
      <div className="space-y-4">
        {quizQuestionsMap[1].map((q) => (
          <QuizQuestion
            key={q.id}
            question={q}
            chapterNum={1}
            selectedOption={answers[q.id]}
            onSelectOption={(qId, option) =>
              handleQuizAction(1, "select", qId, option)
            }
            isSubmitted={isSubmitted}
            correctAnswer={correctAnswers[1]?.[q.id]}
          />
        ))}
      </div>
      {!isSubmitted && (
        <button
          className="mt-6 px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl shadow-lg transition hover:shadow-xl"
          onClick={() => handleQuizAction(1, "submit")}>
          Submit Quiz
        </button>
      )}
      {result && (
        <div
          className={`mt-6 p-6 rounded-xl border-l-4 ${result.bgColor}`}
          style={{ borderColor: result.borderColor }}>
          <div dangerouslySetInnerHTML={{ __html: result.message }}></div>
        </div>
      )}
    </>
  );

  return (
    <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-xl min-h-[500px]">
      <div className="flex gap-4 mb-6 flex-wrap">
        <TabButton
          isActive={activeTab === "theory"}
          onClick={() => setActiveTab("theory")}
          colors={colors}
          icon="📚">
          Theory
        </TabButton>
        <TabButton
          isActive={activeTab === "examples"}
          onClick={() => setActiveTab("examples")}
          colors={colors}
          icon="📖">
          Examples (Segera Hadir)
        </TabButton>
        <TabButton
          isActive={activeTab === "practice"}
          onClick={() => setActiveTab("practice")}
          colors={colors}
          icon="✍️">
          Practice
        </TabButton>
        <TabButton
          isActive={activeTab === "quiz"}
          onClick={() => setActiveTab("quiz")}
          colors={colors}
          icon="🎯">
          Quiz
        </TabButton>
      </div>
      <div>
        {activeTab === "theory" && renderTheory()}
        {/* {activeTab === 'examples' && renderExamples()} */}
        {activeTab === "practice" && renderPractice()}
        {activeTab === "quiz" && renderQuiz()}
      </div>
    </div>
  );
};
// --- End Chapter 1 Content ---

// --- Chapter 2 Content (Structural) ---
ChapterContentMap[2] = ({ chapter, colors, quizState, handleQuizAction }) => {
  const [activeTab, setActiveTab] = useState("theory");
  const { answers, isSubmitted, result } = quizState;

  const renderTheory = () => (
    <>
      <h2 className="text-3xl font-bold mb-6">🍜 Chapter 2: Culinary and Me</h2>
      <InfoBox title="🎯 Learning Objectives" borderColor={colors.border}>
        <p>Setelah mempelajari chapter ini, kamu akan bisa:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Mendeskripsikan makanan favoritmu</li>
          <li>Menulis resep dalam Bahasa Inggris</li>
          <li>Menggunakan Imperative Sentences (kalimat perintah)</li>
          <li>Memahami Procedure Text</li>
        </ul>
      </InfoBox>

      <h3 className="text-2xl font-semibold mt-8 mb-4">
        Unit 1 & 2: Describing Food
      </h3>
      <InfoBox borderColor={colors.border}>
        <h4 className="text-xl font-bold mb-2">Food Vocabulary:</h4>
        <p>
          <strong>Taste (Rasa):</strong> sweet, salty, sour, bitter, spicy,
          savory, delicious
        </p>
        <p>
          <strong>Texture (Tekstur):</strong> crunchy, crispy, soft, chewy,
          smooth, creamy
        </p>
      </InfoBox>

      <h3 className="text-2xl font-semibold mt-8 mb-4">
        Unit 3: Procedure Text (Recipe)
      </h3>
      <InfoBox borderColor={colors.border}>
        <h4 className="text-xl font-bold mb-2">
          Structure & Language Features:
        </h4>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Goal/Title</li>
          <li>Materials/Ingredients</li>
          <li>Steps (menggunakan Imperative Sentences: Add, Mix, Cut, Pour)</li>
        </ol>
        <p className="mt-2">
          Gunakan Sequence Words: First, Second, Then, After that, Finally.
        </p>
      </InfoBox>
    </>
  );

  const renderQuiz = () => (
    <>
      <h2 className="text-3xl font-bold mb-6">🎯 Chapter 2 Quiz</h2>
      <p className="mb-6">Uji pemahamanmu tentang Procedure Text!</p>
      <div className="space-y-4">
        {quizQuestionsMap[2].map((q) => (
          <QuizQuestion
            key={q.id}
            question={q}
            chapterNum={2}
            selectedOption={answers[q.id]}
            onSelectOption={(qId, option) =>
              handleQuizAction(2, "select", qId, option)
            }
            isSubmitted={isSubmitted}
            correctAnswer={correctAnswers[2]?.[q.id]}
          />
        ))}
      </div>
      {!isSubmitted && (
        <button
          className="mt-6 px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl shadow-lg transition hover:shadow-xl"
          onClick={() => handleQuizAction(2, "submit")}>
          Submit Quiz
        </button>
      )}
      {result && (
        <div
          className={`mt-6 p-6 rounded-xl border-l-4 ${result.bgColor}`}
          style={{ borderColor: result.borderColor }}>
          <div dangerouslySetInnerHTML={{ __html: result.message }}></div>
        </div>
      )}
    </>
  );

  return (
    <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-xl min-h-[500px]">
      <div className="flex gap-4 mb-6 flex-wrap">
        <TabButton
          isActive={activeTab === "theory"}
          onClick={() => setActiveTab("theory")}
          colors={colors}
          icon="📚">
          Theory
        </TabButton>
        <TabButton
          isActive={activeTab === "examples"}
          onClick={() => setActiveTab("examples")}
          colors={colors}
          icon="📖">
          Examples (Segera Hadir)
        </TabButton>
        <TabButton
          isActive={activeTab === "practice"}
          onClick={() => setActiveTab("practice")}
          colors={colors}
          icon="✍️">
          Practice (Segera Hadir)
        </TabButton>
        <TabButton
          isActive={activeTab === "quiz"}
          onClick={() => setActiveTab("quiz")}
          colors={colors}
          icon="🎯">
          Quiz
        </TabButton>
      </div>
      <div>
        {activeTab === "theory" && renderTheory()}
        {activeTab === "quiz" && renderQuiz()}
        {activeTab === "examples" && (
          <p className="text-gray-500 italic p-6">
            Contoh-contoh akan ditambahkan segera!
          </p>
        )}
        {activeTab === "practice" && (
          <p className="text-gray-500 italic p-6">
            Latihan akan ditambahkan segera!
          </p>
        )}
      </div>
    </div>
  );
};
// --- End Chapter 2 Content ---

// --- Chapter 3-5 Content (Structural/Placeholders) ---
const createPlaceholderContent =
  (chapterNum) =>
  ({ chapter, colors }) => {
    const [activeTab, setActiveTab] = useState("theory");
    const placeholders = {
      3: {
        theory: (
          <>
            <h2 className="text-3xl font-bold mb-6">
              🏠 Chapter 3: Home Sweet Home
            </h2>
            <InfoBox
              title="Unit 1: Rooms in the House"
              borderColor={colors.border}>
              Vocabulary: Living Room, Bedroom, Kitchen, Bathroom.
            </InfoBox>
            <ExampleBox title="Unit 2: Prepositions of Place">
              in, on, under, beside, between. Example: The book is{" "}
              <span className="font-semibold">on</span> the table.
            </ExampleBox>
            <InfoBox
              title="Unit 3: Describing Your Room"
              borderColor={colors.border}>
              Using 'There is' (Singular) / 'There are' (Plural).
            </InfoBox>
          </>
        ),
      },
      4: {
        theory: (
          <>
            <h2 className="text-3xl font-bold mb-6">
              📚 Chapter 4: My School Activities
            </h2>
            <InfoBox
              title="Unit 1: School Subjects and Time"
              borderColor={colors.border}>
              School Subjects: Math, Science, P.E. Time Expressions: At seven
              o'clock, In the morning.
            </InfoBox>
            <ExampleBox title="Unit 2: Daily Routine">
              Using Simple Present Tense. I wake up, My school starts.
            </ExampleBox>
          </>
        ),
      },
      5: {
        theory: (
          <>
            <h2 className="text-3xl font-bold mb-6">
              🏫 Chapter 5: This is My School
            </h2>
            <InfoBox
              title="Unit 1: School Facilities"
              borderColor={colors.border}>
              Vocabulary: Classroom, Library, Canteen, Teacher's Office.
            </InfoBox>
            <ExampleBox title="Unit 2: Describing School Places">
              There is a big school yard. There are twenty classrooms.
            </ExampleBox>
            <InfoBox
              title="Unit 3: Extracurricular Activities"
              borderColor={colors.border}>
              Scout, Basketball Club, English Club, etc.
            </InfoBox>
          </>
        ),
      },
    };

    return (
      <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-xl min-h-[500px]">
        <div className="flex gap-4 mb-6 flex-wrap">
          <TabButton
            isActive={activeTab === "theory"}
            onClick={() => setActiveTab("theory")}
            colors={colors}
            icon="📚">
            Theory
          </TabButton>
          <TabButton
            isActive={activeTab === "examples"}
            onClick={() => setActiveTab("examples")}
            colors={colors}
            icon="📖">
            Examples (Segera Hadir)
          </TabButton>
          <TabButton
            isActive={activeTab === "practice"}
            onClick={() => setActiveTab("practice")}
            colors={colors}
            icon="✍️">
            Practice (Segera Hadir)
          </TabButton>
          <TabButton
            isActive={activeTab === "quiz"}
            onClick={() => setActiveTab("quiz")}
            colors={colors}
            icon="🎯">
            Quiz (Segera Hadir)
          </TabButton>
        </div>
        <div>
          {activeTab === "theory" && placeholders[chapterNum].theory}
          {activeTab !== "theory" && (
            <p className="text-gray-500 italic p-6">
              Materi ini sedang disiapkan. Fokus pada tab Theory dan Chapter 0-2
              terlebih dahulu!
            </p>
          )}
        </div>
      </div>
    );
  };

ChapterContentMap[3] = createPlaceholderContent(3);
ChapterContentMap[4] = createPlaceholderContent(4);
ChapterContentMap[5] = createPlaceholderContent(5);

// =================================================================
// 4. MAIN APPLICATION COMPONENT (EasyMateri7)
// =================================================================

export default function EasyMateri7() {
  const [currentChapter, setCurrentChapter] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({}); // { chapterId: { qId: answer, isSubmitted, result } }
  const [practiceTexts, setPracticeTexts] = useState({}); // { chapterId: { taskId: { text, feedback } } }

  // Mode Presentasi: buat dipakai guru pas ngajar depan kelas pakai proyektor
  const [presentationMode, setPresentationMode] = useState(false);

  const togglePresentationMode = useCallback(() => {
    setPresentationMode((prev) => !prev);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const chapter = useMemo(
    () => chapterData.find((c) => c.num === currentChapter),
    [currentChapter],
  );

  const handleOpenChapter = useCallback((chapterNum) => {
    setCurrentChapter(chapterNum);
    window.scrollTo(0, 0);
  }, []);

  const handleGoHome = useCallback(() => {
    setCurrentChapter(null);
    window.scrollTo(0, 0);
  }, []);

  const handleQuizAction = useCallback(
    (chapterId, action, questionId, option) => {
      setQuizAnswers((prev) => {
        const currentQuiz = prev[chapterId] || {
          answers: {},
          isSubmitted: false,
          result: null,
        };

        if (action === "select") {
          if (currentQuiz.isSubmitted) return prev;
          return {
            ...prev,
            [chapterId]: {
              ...currentQuiz,
              answers: { ...currentQuiz.answers, [questionId]: option },
            },
          };
        }

        if (action === "submit") {
          const answers = correctAnswers[chapterId];
          const totalQuestions = Object.keys(answers).length;

          if (Object.keys(currentQuiz.answers).length < totalQuestions) {
            alert(
              `Mohon jawab semua ${totalQuestions} pertanyaan terlebih dahulu!`,
            );
            return prev;
          }

          let score = 0;
          for (const qId in answers) {
            if (currentQuiz.answers[qId] === answers[qId]) score++;
          }

          const percentage = (score / totalQuestions) * 100;
          let message = "";
          let bgColor = "";
          let borderColor = "";

          if (percentage >= 80) {
            message = `<h3>🎉 Excellent!</h3><p>Skor kamu: <strong>${score}/${totalQuestions} (${percentage.toFixed(
              0,
            )}%)</strong></p><p>Pemahaman kamu sangat baik! Keep up the good work! 🌟</p>`;
            bgColor = "bg-emerald-50";
            borderColor = "#43e97b";
          } else if (percentage >= 60) {
            message = `<h3>👍 Good Job!</h3><p>Skor kamu: <strong>${score}/${totalQuestions} (${percentage.toFixed(
              0,
            )}%)</strong></p><p>Lumayan bagus! Tapi masih bisa ditingkatkan lagi. Coba review materi yang salah ya! 📚</p>`;
            bgColor = "bg-yellow-50";
            borderColor = "#ffc107";
          } else {
            message = `<h3>💪 Keep Trying!</h3><p>Skor kamu: <strong>${score}/${totalQuestions} (${percentage.toFixed(
              0,
            )}%)</strong></p><p>Jangan menyerah! Coba baca lagi materi di tab Theory dan Examples, lalu coba lagi quiz-nya! 🚀</p>`;
            bgColor = "bg-red-50";
            borderColor = "#f5576c";
          }

          return {
            ...prev,
            [chapterId]: {
              ...currentQuiz,
              isSubmitted: true,
              result: { message, bgColor, borderColor },
            },
          };
        }
        return prev;
      });
    },
    [],
  );

  const handlePracticeAction = useCallback(
    (chapterId, taskId, action, text = "") => {
      setPracticeTexts((prev) => {
        const currentChapterTasks = prev[chapterId] || {};
        const currentTask = currentChapterTasks[taskId] || {
          text: "",
          feedback: null,
        };

        if (action === "update") {
          return {
            ...prev,
            [chapterId]: {
              ...currentChapterTasks,
              [taskId]: { ...currentTask, text: text, feedback: null },
            },
          };
        }

        if (action === "clear") {
          if (window.confirm("Yakin mau hapus semua tulisan?")) {
            return {
              ...prev,
              [chapterId]: {
                ...currentChapterTasks,
                [taskId]: { text: "", feedback: null },
              },
            };
          }
          return prev;
        }

        if (action === "check") {
          const t = currentTask.text.trim();
          if (t === "") {
            const feedback =
              '<div class="p-4 bg-red-100 border-l-4 border-red-500"><strong>⚠️ Oops!</strong><br>Kamu belum menulis apa-apa. Yuk mulai menulis!</div>';
            return {
              ...prev,
              [chapterId]: {
                ...currentChapterTasks,
                [taskId]: { ...currentTask, feedback: feedback },
              },
            };
          }

          let score = 0;
          let tips = [];
          let message, bgColor, borderColor;

          // 1. Check length
          if (t.length > 150) score += 25;
          else
            tips.push("Coba tulis lebih panjang lagi (minimal 150 karakter)");

          // 2. Check capital letters
          const sentences = t
            .split(/[.!?]+/)
            .filter((s) => s.trim().length > 0);
          let correctCaps = 0;
          sentences.forEach((s) => {
            if (/^[A-Z]/.test(s.trim())) {
              correctCaps++;
            }
          });
          if (correctCaps > 0) score += 25;
          if (correctCaps === sentences.length && sentences.length > 0)
            tips.push("Good job! Kapitalisasi sudah benar di semua kalimat.");
          else if (sentences.length > 0)
            tips.push(
              "Periksa kembali: Pastikan setiap awal kalimat menggunakan huruf kapital.",
            );

          // 3. Check sentence count
          if (sentences.length >= 5) score += 25;
          else tips.push("Minimal 5 kalimat ya!");

          // 4. Check for key content (adjectives/verbs)
          const hasContent =
            /\b(is|are|am|have|has|like|love|tall|short|kind|smart|friendly|go|eat|study|cook)\b/i.test(
              t,
            );
          if (hasContent) score += 25;
          else tips.push("Gunakan lebih banyak kata sifat dan kata kerja");

          if (score >= 75) {
            message = `<strong>🎉 Excellent!</strong><br>Score: ${score}/100<br>Tulisan kamu sudah bagus! Keep writing! 🌟`;
            bgColor = "bg-emerald-50";
            borderColor = "#43e97b";
          } else if (score >= 50) {
            message = `<strong>👍 Good Job!</strong><br>Score: ${score}/100<br>Tips:<br>• ${tips.join(
              "<br>• ",
            )}`;
            bgColor = "bg-yellow-50";
            borderColor = "#ffc107";
          } else {
            message = `<strong>💪 Keep Trying!</strong><br>Score: ${score}/100<br>Tips:<br>• ${tips.join(
              "<br>• ",
            )}`;
            bgColor = "bg-red-50";
            borderColor = "#f5576c";
          }

          const feedbackHtml = `<div class="p-4 rounded-xl border-l-4" style="background: ${bgColor}; border-color: ${borderColor};">${message}</div>`;

          return {
            ...prev,
            [chapterId]: {
              ...currentChapterTasks,
              [taskId]: { ...currentTask, feedback: feedbackHtml },
            },
          };
        }
        return prev;
      });
    },
    [],
  );

  const currentQuizState = quizAnswers[currentChapter] || {
    answers: {},
    isSubmitted: false,
    result: null,
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-4 sm:p-8 font-sans"
      style={presentationMode ? { zoom: 1.25 } : undefined}>
      <div
        className={`mx-auto ${presentationMode ? "max-w-5xl" : "max-w-7xl"}`}>
        {/* Teacher Toolbar - selalu terlihat, buat guru kontrol tampilan */}
        <div className="fixed top-3 right-3 z-50 flex gap-2">
          <button
            onClick={togglePresentationMode}
            title="Mode Presentasi: perbesar tampilan buat proyektor"
            className={`px-3 py-2 rounded-lg font-semibold text-sm shadow-lg transition ${
              presentationMode
                ? "bg-indigo-600 text-white"
                : "bg-white text-indigo-600 border border-indigo-200"
            }`}>
            🖥️ {presentationMode ? "Mode Presentasi: ON" : "Mode Presentasi"}
          </button>
          <button
            onClick={toggleFullscreen}
            title="Fullscreen"
            className="px-3 py-2 rounded-lg font-semibold text-sm shadow-lg bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition">
            ⛶
          </button>
        </div>

        {/* Header */}
        <div
          className={`bg-white p-10 rounded-3xl text-center mb-8 shadow-2xl ${
            currentChapter !== null ? "hidden sm:block" : ""
          }`}>
          <h1 className="text-4xl sm:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 mb-2">
            🎓 English for Nusantara
          </h1>
          <p className="text-gray-600 text-lg">
            Interactive Learning Platform - Kelas 7
          </p>
          <p className="text-gray-400 text-sm italic mt-2">
            Belajar Bahasa Inggris dengan Cara yang Menyenangkan!
          </p>
        </div>

        {/* Navigation Bar */}
        {currentChapter !== null && chapter && (
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-xl mb-6 sticky top-4 z-10">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <button
                className="px-4 py-2 bg-indigo-50 rounded-lg font-bold text-indigo-600 transition hover:bg-indigo-600 hover:text-white hover:shadow-md"
                onClick={handleGoHome}>
                ← Kembali ke Home
              </button>
              <span className="text-lg sm:text-xl font-bold text-indigo-600">
                {chapter.title}: {chapter.subtitle}
              </span>
            </div>

            {presentationMode && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {chapterData.map((c) => (
                  <button
                    key={c.num}
                    onClick={() => handleOpenChapter(c.num)}
                    title={`${c.title}: ${c.subtitle}`}
                    className={`w-10 h-10 rounded-lg font-bold text-sm transition ${
                      c.num === currentChapter
                        ? `text-white bg-gradient-to-r ${c.colors.gradient}`
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}>
                    {c.num}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content Area */}
        {currentChapter === null ? (
          // Homepage View
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {chapterData.map((c) => (
              <ChapterCard
                key={c.num}
                chapter={c}
                onClick={handleOpenChapter}
              />
            ))}
          </div>
        ) : (
          // Chapter View
          chapter && (
            <div key={currentChapter}>
              {React.createElement(ChapterContentMap[currentChapter], {
                chapter,
                colors: chapter.colors,
                quizState: currentQuizState,
                handleQuizAction,
                practiceState: practiceTexts,
                handlePracticeAction,
              })}
            </div>
          )
        )}

        {/* Footer */}
        <div className="bg-white p-6 rounded-xl text-center mt-8 shadow-lg">
          <p className="text-gray-600">
            <strong>English for Nusantara Interactive Platform</strong>
          </p>
          <p className="text-gray-500 text-sm">
            Kurikulum Merdeka - Kelas 7 SMP/MTs
          </p>
        </div>
      </div>
    </div>
  );
}

// Catatan: Jika Anda menggunakan `export default function App() {}` di file `App.js` Anda,
// ganti `export default function EasyMateri7() {` di atas menjadi `export default function App() {`
// dan sesuaikan impor jika diperlukan. File ini adalah komponen utama tunggal (App/EasyMateri7).
