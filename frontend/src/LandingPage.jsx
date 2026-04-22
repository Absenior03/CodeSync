// src/LandingPage.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Code, LogIn, PlusSquare, UsersRound, CirclePlus } from 'lucide-react';
import DynamicBackground from './DynamicBackground'; // Import the new component
import FuzzyText from './FuzzyText';

const LandingPage = ({ onJoin, serverError = '' }) => {
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinUsername, setJoinUsername] = useState('');
  const [createRoomId, setCreateRoomId] = useState('');
  const [createUsername, setCreateUsername] = useState('');
  const [joinErrors, setJoinErrors] = useState({ username: '', roomId: '' });
  const [createErrors, setCreateErrors] = useState({ username: '', roomId: '' });
  const [activeForm, setActiveForm] = useState('join');
  const [formAnimationClass, setFormAnimationClass] = useState('');
  const [cardTransform, setCardTransform] = useState('rotateX(0deg) rotateY(0deg) scale(1)');
  const [isTypingInInput, setIsTypingInInput] = useState(false);
  const animationTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  const handleJoinClick = () => {
    const username = joinUsername.trim();
    const roomId = joinRoomId.trim();
    const nextErrors = { username: '', roomId: '' };
    let hasError = false;

    if (!username) {
      nextErrors.username = 'Username is required.';
      hasError = true;
    }

    if (!roomId) {
      nextErrors.roomId = 'Room ID is required.';
      hasError = true;
    } else if (!/^\d{6}$/.test(roomId)) {
      nextErrors.roomId = 'Room ID must be exactly 6 digits.';
      hasError = true;
    }

    setJoinErrors(nextErrors);
    if (hasError) {
      return;
    }

    onJoin(roomId, username, { mode: 'join' });
  };

  const handleCreateRoom = () => {
    const username = createUsername.trim();
    const roomId = createRoomId.trim();
    const nextErrors = { username: '', roomId: '' };
    let hasError = false;

    if (!username) {
      nextErrors.username = 'Username is required.';
      hasError = true;
    }

    if (roomId && !/^\d{6}$/.test(roomId)) {
      nextErrors.roomId = 'Custom room ID must be exactly 6 digits.';
      hasError = true;
    }

    setCreateErrors(nextErrors);
    if (hasError) {
      return;
    }

    onJoin(roomId, username, { mode: 'create' });
  };

  const switchForm = (targetForm) => {
    if (targetForm === activeForm || formAnimationClass) {
      return;
    }

    setIsTypingInInput(false);
    setCardTransform('rotateX(0deg) rotateY(0deg) scale(1)');
    setFormAnimationClass(targetForm === 'create' ? 'animate-to-create' : 'animate-to-join');

    animationTimeoutRef.current = setTimeout(() => {
      setActiveForm(targetForm);
      setFormAnimationClass('');
      setCardTransform('rotateX(0deg) rotateY(0deg) scale(1)');
    }, 1200);
  };

  const handleCardMove = (event) => {
    if (formAnimationClass) return;

    const interactiveTarget = event.target.closest('input, button, a, textarea, select, label');
    if (interactiveTarget) {
      setCardTransform('rotateX(0deg) rotateY(0deg) scale(1)');
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateY = ((x / rect.width) - 0.5) * 12;
    const rotateX = ((y / rect.height) - 0.5) * -12;
    setCardTransform(`rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(1.01)`);
  };

  const resetCardTransform = () => {
    setCardTransform('rotateX(0deg) rotateY(0deg) scale(1)');
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-full overflow-hidden">
      <DynamicBackground isInputActive={isTypingInInput} />
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="text-center">
          {serverError ? (
            <div className="mb-4 rounded-lg border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {serverError}
            </div>
          ) : null}
          <div className="mb-4 flex flex-col items-center gap-3 animate-fade-in-down">
            <div className="inline-flex items-center gap-3 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2">
              <Code size={32} className="text-cyan-300" />
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200">
                Realtime Collaborative IDE
              </span>
            </div>
            <FuzzyText
              fontSize="clamp(2.6rem, 9vw, 5.8rem)"
              fontWeight={900}
              color="#67e8f9"
              enableHover={true}
              baseIntensity={0.12}
              hoverIntensity={0.48}
              fuzzRange={22}
              clickEffect={true}
              transitionDuration={160}
              direction="both"
              letterSpacing={0.8}
              className="mx-auto cursor-pointer"
            >
              CodeSync
            </FuzzyText>
          </div>
        </div>
          <div className="w-full max-w-5xl px-4">
            <div
              className={`room-switcher ${activeForm === 'create' ? 'show-create' : 'show-join'} ${formAnimationClass}`}
              style={{ perspective: '1200px' }}
            >
              <div
                className="room-card room-card-create"
              >
                <div
                  onMouseMove={activeForm === 'create' ? handleCardMove : undefined}
                  onMouseLeave={resetCardTransform}
                  onTouchEnd={resetCardTransform}
                  className="room-card-shell"
                  style={{
                    transform: activeForm === 'create' && !formAnimationClass ? cardTransform : 'rotateX(0deg) rotateY(0deg) scale(1)',
                    transformStyle: 'preserve-3d',
                    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45), 0 0 30px rgba(56, 189, 248, 0.25)',
                  }}
                >
                  <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-300/12 via-transparent to-sky-400/8" />
                  <div className="relative mb-6 flex items-center gap-3">
                    <CirclePlus className="text-cyan-300" size={24} />
                    <h2 className="text-2xl font-semibold text-white">Create a Room</h2>
                  </div>
                  <p className="relative mb-6 text-sm text-gray-400">
                    Enter your username and optionally choose a 6-digit room ID. Leave it blank to auto-generate one.
                  </p>
                  <div className="relative flex flex-col gap-4">
                    <input
                      type="text"
                      value={createUsername}
                      onChange={(e) => {
                        setCreateUsername(e.target.value);
                        if (createErrors.username) {
                          setCreateErrors((prev) => ({ ...prev, username: '' }));
                        }
                      }}
                      onFocus={() => setIsTypingInInput(true)}
                      onBlur={() => setIsTypingInInput(false)}
                      placeholder="Username"
                      className="px-4 py-3 bg-gray-900/50 border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-lg text-white placeholder-gray-400"
                    />
                    {createErrors.username ? (
                      <p className="-mt-2 text-sm text-rose-300">{createErrors.username}</p>
                    ) : null}
                    <input
                      type="text"
                      value={createRoomId}
                      onChange={(e) => {
                        setCreateRoomId(e.target.value.replace(/\D/g, '').slice(0, 6));
                        if (createErrors.roomId) {
                          setCreateErrors((prev) => ({ ...prev, roomId: '' }));
                        }
                      }}
                      onFocus={() => setIsTypingInInput(true)}
                      onBlur={() => setIsTypingInInput(false)}
                      placeholder="Optional 6-digit Room ID"
                      inputMode="numeric"
                      maxLength={6}
                      className="px-4 py-3 bg-gray-900/50 border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-lg text-white placeholder-gray-400"
                    />
                    {createErrors.roomId ? (
                      <p className="-mt-2 text-sm text-rose-300">{createErrors.roomId}</p>
                    ) : null}
                    <button
                      onClick={handleCreateRoom}
                      className="px-4 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-md font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-cyan-500/50"
                    >
                      <PlusSquare size={20} /> Create Room
                    </button>
                    <div className="text-center text-sm text-gray-400">
                      Already have a room ID?{' '}
                      <button
                        type="button"
                        onClick={() => switchForm('join')}
                        className="text-cyan-300 hover:text-cyan-200 underline underline-offset-4"
                      >
                        Join Room
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="room-card room-card-join"
              >
                <div
                  onMouseMove={activeForm === 'join' ? handleCardMove : undefined}
                  onMouseLeave={resetCardTransform}
                  onTouchEnd={resetCardTransform}
                  className="room-card-shell"
                  style={{
                    transform: activeForm === 'join' && !formAnimationClass ? cardTransform : 'rotateX(0deg) rotateY(0deg) scale(1)',
                    transformStyle: 'preserve-3d',
                    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45), 0 0 30px rgba(56, 189, 248, 0.25)',
                  }}
                >
                  <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-300/12 via-transparent to-sky-400/8" />
                  <div className="relative mb-6 flex items-center gap-3">
                    <UsersRound className="text-cyan-300" size={24} />
                    <h2 className="text-2xl font-semibold text-white">Join a Room</h2>
                  </div>
                  <p className="relative mb-6 text-sm text-gray-400">
                    Enter your username and the 6-digit room ID you want to join.
                  </p>
                  <div className="relative flex flex-col gap-4">
                    <input
                      type="text"
                      value={joinUsername}
                      onChange={(e) => {
                        setJoinUsername(e.target.value);
                        if (joinErrors.username) {
                          setJoinErrors((prev) => ({ ...prev, username: '' }));
                        }
                      }}
                      onFocus={() => setIsTypingInInput(true)}
                      onBlur={() => setIsTypingInInput(false)}
                      placeholder="Username"
                      className="px-4 py-3 bg-gray-900/50 border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-lg text-white placeholder-gray-400"
                    />
                    {joinErrors.username ? (
                      <p className="-mt-2 text-sm text-rose-300">{joinErrors.username}</p>
                    ) : null}
                    <input
                      type="text"
                      value={joinRoomId}
                      onChange={(e) => {
                        setJoinRoomId(e.target.value.replace(/\D/g, '').slice(0, 6));
                        if (joinErrors.roomId) {
                          setJoinErrors((prev) => ({ ...prev, roomId: '' }));
                        }
                      }}
                      onFocus={() => setIsTypingInInput(true)}
                      onBlur={() => setIsTypingInInput(false)}
                      placeholder="6-digit Room ID"
                      inputMode="numeric"
                      maxLength={6}
                      className="px-4 py-3 bg-gray-900/50 border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-lg text-white placeholder-gray-400"
                    />
                    {joinErrors.roomId ? (
                      <p className="-mt-2 text-sm text-rose-300">{joinErrors.roomId}</p>
                    ) : null}
                    <button
                      onClick={handleJoinClick}
                      className="px-4 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-md font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-cyan-500/50"
                    >
                      <LogIn size={20} /> Join Room
                    </button>
                    <div className="text-center text-sm text-gray-400">
                      Need a new room?{' '}
                      <button
                        type="button"
                        onClick={() => switchForm('create')}
                        className="text-cyan-300 hover:text-cyan-200 underline underline-offset-4"
                      >
                        Create Room
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;