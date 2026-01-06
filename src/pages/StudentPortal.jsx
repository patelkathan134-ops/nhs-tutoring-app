import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, Calendar, User, ArrowLeft, X, BookOpen, Clock, Sparkles } from 'lucide-react';
import { getNextSessionDate, isExpired } from '../utils';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';

const SUBJECTS = [
    "Civics EOC", "Biology EOC", "Algebra 1 EOC", "Geometry EOC",
    "AP Pre-Calculus", "AP Calculus AB", "AICE Geography", "AP World History",
    "APUSH", "FAST ELA Grade 10", "AICE Spanish", "Eighth Grade Science Exam",
    "AICE Psychology", "AICE Marine Science"
];

const StudentPortal = () => {
    const navigate = useNavigate();
    const [selectedSubject, setSelectedSubject] = useState('');
    const [tutors, setTutors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [bookingSlot, setBookingSlot] = useState(null);
    const [studentName, setStudentName] = useState('');
    const [isBooking, setIsBooking] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);

    const handleSearch = async () => {
        if (!selectedSubject) return;
        setLoading(true);
        setHasSearched(true);
        setTutors([]);

        try {
            const q = query(collection(db, 'tutors'), where('subjects', 'array-contains', selectedSubject));
            const querySnapshot = await getDocs(q);
            const results = [];
            querySnapshot.forEach((doc) => {
                results.push({ id: doc.id, ...doc.data() });
            });
            setTutors(results);
        } catch (error) {
            console.error("Error searching tutors:", error);
        } finally {
            setLoading(false);
        }
    };

    const openBookingModal = (tutor, slot) => {
        setBookingSlot({
            tutorId: tutor.id,
            slotId: slot.id,
            day: slot.day,
            time: slot.time,
            tutorName: tutor.name,
            bio: tutor.bio,
            gradeLevel: tutor.gradeLevel
        });
        setStudentName('');
        setBookingSuccess(false);
    };

    const handleBookingConfirm = async (e) => {
        e.preventDefault();
        if (!studentName || !bookingSlot) return;

        setIsBooking(true);
        try {
            const tutorRef = doc(db, 'tutors', bookingSlot.tutorId);
            const tutorSnap = await getDoc(tutorRef);

            if (!tutorSnap.exists()) {
                alert("Error: Tutor not found.");
                return;
            }

            const tutorData = tutorSnap.data();
            const slots = tutorData.slots || [];
            const slotIndex = slots.findIndex(s => s.id === bookingSlot.slotId);

            if (slotIndex === -1) {
                alert("Error: Slot not found.");
                return;
            }

            const currentSlot = slots[slotIndex];
            const expired = currentSlot.status === 'Booked' && currentSlot.expiryDate && isExpired(currentSlot.expiryDate);

            if (currentSlot.status !== 'Available' && !expired) {
                alert("This slot has already been booked by someone else.");
                handleSearch();
                setBookingSlot(null);
                return;
            }

            const expiryDate = getNextSessionDate(bookingSlot.day, bookingSlot.time);

            slots[slotIndex].status = 'Booked';
            slots[slotIndex].studentName = studentName;
            slots[slotIndex].subject = selectedSubject;
            slots[slotIndex].expiryDate = expiryDate;

            await updateDoc(tutorRef, { slots });

            setBookingSuccess(true);
            setTimeout(() => {
                setBookingSlot(null);
                setBookingSuccess(false);
                handleSearch();
            }, 2000);
        } catch (error) {
            console.error("Booking error:", error);
            alert("Failed to book session. Please try again.");
        } finally {
            setIsBooking(false);
        }
    };

    return (
        <div className="min-h-screen px-4 py-8 md:py-12">
            {/* Animated background orbs */}
            <div className="fixed top-20 left-10 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float pointer-events-none"></div>
            <div className="fixed bottom-20 right-10 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float pointer-events-none" style={{ animationDelay: '2s' }}></div>

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/')}
                    className="mb-6 text-white/80 hover:text-white transition-colors flex items-center gap-2 group animate-fade-in"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Home</span>
                </button>

                {/* Header */}
                <div className="text-center mb-12 animate-slide-up">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Find Your <span className="gradient-text">Perfect Tutor</span>
                    </h1>
                    <p className="text-white/80 text-lg">Search by subject and book a session with expert peer tutors</p>
                </div>

                {/* Search Section */}
                <div className="mb-12 animate-slide-up" style={{ animationDelay: '100ms' }}>
                    <GlassCard hover={false}>
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={20} />
                                <select
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm appearance-none cursor-pointer"
                                >
                                    <option value="" className="text-gray-900">-- Select a Subject --</option>
                                    {SUBJECTS.map(s => <option key={s} value={s} className="text-gray-900">{s}</option>)}
                                </select>
                            </div>
                            <Button
                                onClick={handleSearch}
                                disabled={!selectedSubject || loading}
                                variant="primary"
                                size="lg"
                                className="md:w-auto whitespace-nowrap"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <LoadingSpinner size="sm" />
                                        <span>Searching...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Search size={20} />
                                        <span>Search Tutors</span>
                                    </div>
                                )}
                            </Button>
                        </div>
                    </GlassCard>
                </div>

                {/* Results */}
                <div className="space-y-6">
                    {hasSearched && tutors.length === 0 && !loading && (
                        <div className="text-center py-16 animate-fade-in">
                            <GlassCard hover={false}>
                                <BookOpen className="mx-auto mb-4 text-white/50" size={48} />
                                <p className="text-white/70 text-lg">No tutors found for <span className="font-semibold text-white">{selectedSubject}</span></p>
                                <p className="text-white/50 text-sm mt-2">Try selecting a different subject</p>
                            </GlassCard>
                        </div>
                    )}

                    {tutors.map((tutor, index) => {
                        const availableSlots = (tutor.slots || []).filter(s => {
                            if (s.status === 'Available') return true;
                            if (s.status === 'Booked' && s.expiryDate && isExpired(s.expiryDate)) return true;
                            return false;
                        });

                        if (availableSlots.length === 0) return null;

                        return (
                            <div
                                key={tutor.id}
                                className="animate-scale-in"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <GlassCard hover={false}>
                                    {/* Tutor Header */}
                                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full blur-md opacity-50"></div>
                                                <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                                    {tutor.name.charAt(0)}
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold text-white">{tutor.name}</h3>
                                                {tutor.gradeLevel && (
                                                    <span className="text-white/60 text-sm">{tutor.gradeLevel}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="glassmorphic px-4 py-2 rounded-xl border border-white/20 flex items-center gap-2">
                                            <Sparkles size={16} className="text-yellow-300" />
                                            <span className="text-white font-medium">{selectedSubject}</span>
                                        </div>
                                    </div>

                                    {/* Bio */}
                                    {tutor.bio && (
                                        <div className="mb-6 p-4 rounded-xl bg-white/5 border-l-4 border-purple-400">
                                            <p className="text-white/80 italic">"{tutor.bio}"</p>
                                        </div>
                                    )}

                                    {/* Available Slots */}
                                    <div>
                                        <h4 className="text-white/90 font-semibold mb-3 flex items-center gap-2">
                                            <Clock size={18} />
                                            Available Sessions
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {availableSlots.map(slot => (
                                                <button
                                                    key={slot.id}
                                                    onClick={() => openBookingModal(tutor, slot)}
                                                    className="group flex items-center justify-between p-4 rounded-xl bg-white/5 border-2 border-white/10 hover:border-white/30 hover:bg-white/10 transition-all duration-200"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Calendar size={20} className="text-blue-400" />
                                                        <div className="flex flex-col items-start">
                                                            <span className="font-semibold text-white">{slot.day}</span>
                                                            <span className="text-sm text-white/70">{slot.time}</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-bold text-purple-400 group-hover:text-purple-300">Book →</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </GlassCard>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Booking Modal */}
            {bookingSlot && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="w-full max-w-md animate-scale-in">
                        <GlassCard hover={false} className="relative">
                            {/* Close Button */}
                            <button
                                onClick={() => setBookingSlot(null)}
                                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>

                            {bookingSuccess ? (
                                <div className="text-center py-8">
                                    <div className="mb-4 relative">
                                        <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                                        <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center">
                                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h3>
                                    <p className="text-white/70">Your session has been scheduled successfully</p>
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-2xl font-bold text-white mb-6">Confirm Booking</h3>

                                    {/* Session Details */}
                                    <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-400/30 space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-white/70">Tutor:</span>
                                            <span className="text-white font-semibold">{bookingSlot.tutorName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/70">Subject:</span>
                                            <span className="text-white font-semibold">{selectedSubject}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/70">Time:</span>
                                            <span className="text-white font-semibold">{bookingSlot.day}, {bookingSlot.time}</span>
                                        </div>
                                    </div>

                                    {/* Bio */}
                                    {bookingSlot.bio && (
                                        <div className="mb-6 p-3 rounded-lg bg-white/5 border-l-4 border-blue-400">
                                            <p className="text-white/70 text-sm italic">"{bookingSlot.bio}"</p>
                                        </div>
                                    )}

                                    {/* Form */}
                                    <form onSubmit={handleBookingConfirm}>
                                        <div className="mb-6">
                                            <label className="block text-white/90 text-sm font-medium mb-2">Your Name</label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={20} />
                                                <input
                                                    type="text"
                                                    value={studentName}
                                                    onChange={(e) => setStudentName(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
                                                    placeholder="Enter your full name"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <Button
                                                type="button"
                                                onClick={() => setBookingSlot(null)}
                                                variant="outline"
                                                size="lg"
                                                className="flex-1"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={isBooking}
                                                variant="primary"
                                                size="lg"
                                                className="flex-1"
                                            >
                                                {isBooking ? (
                                                    <div className="flex items-center gap-2">
                                                        <LoadingSpinner size="sm" />
                                                        <span>Booking...</span>
                                                    </div>
                                                ) : (
                                                    'Confirm'
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </GlassCard>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentPortal;
