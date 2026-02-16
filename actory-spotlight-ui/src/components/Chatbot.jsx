import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, X, Send, Bot, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const FAQ_DATA = {
    default: [
        {
            question: "What is Actory?",
            answer: "Actory is a comprehensive platform connecting actors with production houses for film and video casting opportunities, streamlining the entire audition process."
        },
        {
            question: "Who can use Actory?",
            answer: "Actory is designed for Actors (Artists), Recruiters (Producers), Production Teams, and Admins to manage the casting workflow."
        },
        {
            question: "Is registration free?",
            answer: "Yes, registration is free for both Actors and Recruiters. Some premium features may differ."
        },
        {
            question: "I forgot my password",
            answer: "Click on the 'Forgot Password?' link on the login page and follow the instructions to reset it via email."
        },
        {
            question: "I can’t log in to my account",
            answer: "Please check your email and password. If the issue persists, try resetting your password or contact support."
        },
        {
            question: "How do I reset my password?",
            answer: "Go to the Login page, click 'Forgot Password', enter your registered email, and use the link sent to you to set a new password."
        },
        {
            question: "How can I contact support?",
            answer: "You can reach out to our support team via the 'Contact Us' page or email support@actory.com."
        }
    ],
    Actor: [
        {
            question: "How do I create an actor account?",
            answer: "Go to the Register page and select 'Join as Actor'. Fill in your details to create your account."
        },
        {
            question: "How can I edit my profile details?",
            answer: "Navigate to your Profile page and click the 'Edit Profile' button to update your bio, physical stats, and other information."
        },
        {
            question: "What information should I add to my profile?",
            answer: "Add your bio, physical attributes (height, age, etc.), skills, experience, and contact details to make your profile stand out."
        },
        {
            question: "Can I upload profile photos?",
            answer: "Yes, you can upload a profile picture and other portfolio images in the 'Photos' section of your profile."
        },
        {
            question: "How do I update my skills and experience?",
            answer: "In the 'Edit Profile' section, you can add or remove skills and update your experience level."
        },
        {
            question: "Can I change my contact details?",
            answer: "Yes, you can update your phone number and address in your profile settings."
        },
        {
            question: "How can I find available auditions?",
            answer: "Go to the 'Casting Calls' page to browse and filter available auditions by role, location, and criteria."
        },
        {
            question: "Where can I apply for casting calls?",
            answer: "Click on any casting call card to view details, then click the 'Apply Now' button to submit your application."
        },
        {
            question: "How do I upload an audition video?",
            answer: "During the application process, you will be prompted to upload an audition video directly to the platform."
        },
        {
            question: "Is there a limit on video size?",
            answer: "Yes, keeping videos under 100MB is results in faster uploads, though we support larger files via Cloudinary."
        },
        {
            question: "Can I apply to multiple projects?",
            answer: "Absolutely! You can apply to as many casting calls as you fit the requirements for."
        },
        {
            question: "How do I withdraw an application?",
            answer: "Currently, you cannot withdraw an application once submitted. Please contact the casting director if strictly necessary."
        },
        {
            question: "How can I check my audition status?",
            answer: "Go to your 'Dashboard' to view a list of your applications and their current status (Pending, Shortlisted, Rejected)."
        },
        {
            question: "What does “under review” mean?",
            answer: "It means the casting team has received your application and is currently evaluating it."
        },
        {
            question: "How will I know if I’m shortlisted?",
            answer: "You will receive a notification in the app, and your application status will change to 'Shortlisted'."
        },
        {
            question: "I am new to Actory, how do I start?",
            answer: "Complete your profile first, then browse the 'Casting Calls' page to find roles that match your skills."
        },
        {
            question: "What should beginners focus on?",
            answer: "Focus on creating a complete profile, uploading a good introduction video, and applying for 'Beginner' level roles."
        },
        {
            question: "How do I improve my profile visibility?",
            answer: "Keep your profile updated, upload high-quality videos/photos, and list accurate skills."
        }
    ],
    Producer: [
        {
            question: "How do I create a casting project?",
            answer: "Go to 'Projects' in your Dashboard and click 'Create Project'. Fill in the details to set it up."
        },
        {
            question: "How can I post an audition requirement?",
            answer: "Detailed audition requirements are defined when you add 'Roles' to your project."
        },
        {
            question: "What details should be added in a project?",
            answer: "Include project name, genre, description, shoot dates, and location to attract the right talent."
        },
        {
            question: "Can I edit a project after posting?",
            answer: "Yes, you can edit project details from your Dashboard as long as it's not archived."
        },
        {
            question: "How do I close a casting call?",
            answer: "You can close a casting call by editing the role status or archiving the project."
        },
        {
            question: "How can I view actor applications?",
            answer: "Go to your Dashboard, select the casting call, and click 'View Submissions' to see all applicants."
        },
        {
            question: "How do I shortlist actors?",
            answer: "In the submissions view, you can mark applicants as 'Accepted' or 'Rejected'."
        },
        {
            question: "Can I reject or remove an application?",
            answer: "Yes, you can reject an application which will update the status for the actor."
        },
        {
            question: "How can I view audition videos?",
            answer: "Click on an application in the submissions list to play the attached audition video."
        },
        {
            question: "Can multiple recruiters manage one project?",
            answer: "Yes, if they are part of the same Production Team."
        },
        {
            question: "How do I invite team members?",
            answer: "Go to the 'Teams' page, select your team, and use the 'Invite Member' feature."
        },
        {
            question: "How can I contact actors?",
            answer: "You can use the built-in messaging features or contact details provided in their profile if authorized."
        }
    ],
    ProductionTeam: [
        {
            question: "How do I create a casting project?",
            answer: "Go to 'Projects' in your Dashboard and click 'Create Project'. Fill in the details to set it up."
        },
        {
            question: "How do I invite team members?",
            answer: "Go to the 'Teams' page, select your team, and use the 'Invite Member' feature."
        },
        {
            question: "What permissions do I have?",
            answer: "Permissions depend on your role (Owner, Recruiter, or Viewer). Check with your Team Owner for specifics."
        },
        {
            question: "Can multiple recruiters manage one project?",
            answer: "Yes, collaboration is built-in for Production Team members."
        }
    ],
    Admin: [
        {
            question: "How do I view registered users?",
            answer: "Navigate to the Admin Dashboard user list section."
        },
        {
            question: "How do I block or unblock users?",
            answer: "Find the user in the list and toggle their active status."
        },
        {
            question: "How many active projects are there?",
            answer: "Check the Admin Dashboard statistics panel for real-time counts."
        },
        {
            question: "How can I monitor user activity?",
            answer: "Use the activity logs in the Admin panel."
        },
        {
            question: "How do I remove inappropriate content?",
            answer: "You can delete posts or ban users who violate community guidelines from the content management section."
        }
    ]
};

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { type: 'bot', text: "Hi! I'm Actory Bot. How can I help you today?" }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [userRole, setUserRole] = useState('default');
    const scrollRef = useRef(null);

    useEffect(() => {
        // Determine user role from localStorage
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user.role && FAQ_DATA[user.role]) {
                    setUserRole(user.role);
                } else {
                    // Fallback or specific logic
                    if (user.role === 'ProductionTeam' || user.role === 'Producer') setUserRole('Producer');
                    else if (user.role === 'Actor') setUserRole('Actor');
                    else if (user.role === 'Admin') setUserRole('Admin');
                    else setUserRole('default');
                }
            }
        } catch (e) {
            console.error("Error reading user role", e);
        }
    }, [isOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSendMessage = (text) => {
        if (!text.trim()) return;

        // Add user message
        setMessages(prev => [...prev, { type: 'user', text }]);
        setInputValue("");

        // Simulate bot response
        setTimeout(() => {
            const foundFaq = FAQ_DATA[userRole]?.find(q => q.question === text) || FAQ_DATA.default.find(q => q.question === text);
            let botResponse = "I'm still learning! Please try selecting one of the suggested questions.";

            if (foundFaq) {
                botResponse = foundFaq.answer;
            } else {
                // Expanded search
                const allQuestions = [...FAQ_DATA.default, ...(FAQ_DATA[userRole] || [])];
                const match = allQuestions.find(q => q.question.toLowerCase().includes(text.toLowerCase()) || q.answer.toLowerCase().includes(text.toLowerCase()));
                if (match) botResponse = match.answer;
            }

            setMessages(prev => [...prev, { type: 'bot', text: botResponse }]);
        }, 500);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage(inputValue);
        }
    };

    // Combine role-specific and default suggestions
    const suggestions = [...(FAQ_DATA[userRole] || []), ...FAQ_DATA.default];

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Search/Chat Window */}
            <div
                className={cn(
                    "bg-background border shadow-2xl rounded-2xl w-[350px] md:w-[400px] mb-4 overflow-hidden transition-all duration-300 origin-bottom-right pointer-events-auto flex flex-col",
                    isOpen ? "opacity-100 scale-100 translate-y-0 h-[500px]" : "opacity-0 scale-95 translate-y-10 h-0"
                )}
            >
                {/* Header */}
                <div className="bg-primary p-4 flex items-center justify-between text-primary-foreground">
                    <div className="flex items-center gap-2">
                        <div className="bg-white/20 p-1.5 rounded-full">
                            <Bot size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">Actory Assistant</h3>
                            <p className="text-xs opacity-80">Ask me anything!</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-white/20" onClick={() => setIsOpen(false)}>
                        <X size={18} />
                    </Button>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4 bg-slate-50 dark:bg-slate-900/50" ref={scrollRef}>
                    <div className="flex flex-col gap-4">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "flex w-fit max-w-[85%] flex-col gap-2 rounded-lg px-3 py-2 text-sm break-words whitespace-pre-wrap",
                                    msg.type === 'user'
                                        ? "ml-auto bg-primary text-primary-foreground"
                                        : "bg-muted"
                                )}
                            >
                                {msg.text}
                            </div>
                        ))}
                        {/* Suggestions as chips if last message was bot */}
                        {messages[messages.length - 1].type === 'bot' && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {suggestions.map((faq, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSendMessage(faq.question)}
                                        className="text-xs bg-background border hover:bg-muted text-left px-3 py-1.5 rounded-full transition-colors truncate max-w-full"
                                    >
                                        {faq.question}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-3 border-t bg-background flex gap-2">
                    <Input
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="flex-1"
                    />
                    <Button size="icon" onClick={() => handleSendMessage(inputValue)} disabled={!inputValue.trim()}>
                        <Send size={18} />
                    </Button>
                </div>
            </div>

            {/* Toggle Button */}
            <Button
                onClick={() => setIsOpen(!isOpen)}
                size="lg"
                className={cn(
                    "h-14 w-14 rounded-full shadow-lg pointer-events-auto transition-transform hover:scale-105",
                    isOpen ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
                )}
            >
                <MessageSquare size={28} />
            </Button>
        </div>
    );
}
