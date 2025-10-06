'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lightbulb, TrendingUp, Group, Business, Refresh, AutoAwesome, Psychology, Search, CheckCircle } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

const formSchema = z.object({
    industry: z.enum(['technology', 'healthcare', 'finance', 'education', 'retail', 'manufacturing', 'energy', 'transportation', 'entertainment', 'agriculture', 'real_estate', 'food_beverage', 'media', 'consulting', 'other'], {
        required_error: 'Please select an industry'
    }),
    description: z.string().min(10, {
        message: 'Description must be at least 10 characters'
    }).max(2000, {
        message: 'Description must not exceed 2000 characters'
    }),
    targetMarket: z.string().optional(),
    budgetRange: z.string().optional(),
    timeline: z.string().optional(),
    preferences: z.array(z.string()).optional()
})

type FormData = z.infer<typeof formSchema>

const industries = [
    { value: 'technology', label: 'Technology' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'finance', label: 'Finance' },
    { value: 'education', label: 'Education' },
    { value: 'retail', label: 'Retail' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'energy', label: 'Energy' },
    { value: 'transportation', label: 'Transportation' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'agriculture', label: 'Agriculture' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'food_beverage', label: 'Food & Beverage' },
    { value: 'media', label: 'Media' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'other', label: 'Other' }
]

const budgetOptions = [
    '$0 - $10K',
    '$10K - $50K',
    '$50K - $100K',
    '$100K - $500K',
    '$500K - $1M',
    '$1M+'
]

const timelineOptions = [
    '1-3 months',
    '3-6 months',
    '6-12 months',
    '1-2 years',
    '2+ years'
]

const preferenceOptions = [
    { value: 'blue_ocean', label: 'Blue Ocean Focus', icon: AutoAwesome, description: 'Create uncontested market space' },
    { value: 'scalable', label: 'High Scalability', icon: TrendingUp, description: 'Platform or network effects' },
    { value: 'disruptive', label: 'Disruptive Innovation', icon: Psychology, description: 'Break industry norms' },
    { value: 'b2b', label: 'B2B Focus', icon: Business, description: 'Business-to-business solutions' },
    { value: 'b2c', label: 'B2C Focus', icon: Group, description: 'Consumer-facing products' },
    { value: 'validated', label: 'Market Validated', icon: Search, description: 'Data-driven opportunities' }
]

const examplePrompts = [
    "Create a platform that connects local artisans with global markets using AI-powered discovery",
    "Build a subscription service for personalized learning paths in professional skills",
    "Develop an app that gamifies sustainable living habits for urban communities",
    "Design a marketplace for fractional ownership of high-value equipment",
    "Create an AI-powered platform for automated compliance management in healthcare"
]

export function IdeaGenerator() {
    const router = useRouter()
    const [isGenerating, setIsGenerating] = useState(false)
    const [generationProgress, setGenerationProgress] = useState(0)
    const [currentStep, setCurrentStep] = useState('')
    const [selectedPreferences, setSelectedPreferences] = useState<string[]>([])

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            industry: undefined,
            description: '',
            targetMarket: '',
            budgetRange: '',
            timeline: '',
            preferences: []
        }
    })

    const handlePreferenceToggle = (preference: string) => {
        const current = selectedPreferences
        const updated = current.includes(preference)
            ? current.filter(p => p !== preference)
            : [...current, preference]

        setSelectedPreferences(updated)
        form.setValue('preferences', updated)
    }

    const handleExampleClick = (example: string) => {
        form.setValue('description', example)
    }

    const onSubmit = async (data: FormData) => {
        setIsGenerating(true)
        setGenerationProgress(0)
        setCurrentStep('Analyzing market opportunities...')

        try {
            // Simulate progress updates
            const progressSteps = [
                { progress: 20, step: 'Analyzing market opportunities...' },
                { progress: 40, step: 'Applying Blue Ocean Strategy...' },
                { progress: 60, step: 'Generating breakthrough concepts...' },
                { progress: 80, step: 'Validating market potential...' },
                { progress: 100, step: 'Finalizing business plan...' }
            ]

            for (const step of progressSteps) {
                setGenerationProgress(step.progress)
                setCurrentStep(step.step)
                await new Promise(resolve => setTimeout(resolve, 1000))
            }

            // Make API call
            const response = await fetch('/api/ideas/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to generate idea')
            }

            const result = await response.json()

            toast({
                title: 'Idea Generated Successfully!',
                description: 'Your breakthrough business concept is ready.',
            })

            // Redirect to idea page
            router.push(`/ideas/${result.idea.id}`)

        } catch (error) {
            console.error('Generation error:', error)
            toast({
                title: 'Generation Failed',
                description: error instanceof Error ? error.message : 'An unexpected error occurred',
                variant: 'destructive',
            })
        } finally {
            setIsGenerating(false)
            setGenerationProgress(0)
            setCurrentStep('')
        }
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
            >
                <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4">
                    Generate Breakthrough Startup Ideas
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                    Leverage AI, Blue Ocean Strategy, and market research to discover
                    untapped opportunities and create truly innovative business concepts.
                </p>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Form */}
                <div className="lg:col-span-2">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                                    Idea Parameters
                                </CardTitle>
                                <CardDescription>
                                    Describe your vision and let AI create a breakthrough business concept
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                        {/* Industry Selection */}
                                        <FormField
                                            control={form.control}
                                            name="industry"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Industry</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select an industry" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {industries.map((industry) => (
                                                                <SelectItem key={industry.value} value={industry.value}>
                                                                    {industry.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid md:grid-cols-2 gap-4">
                                            {/* Target Market */}
                                            <FormField
                                                control={form.control}
                                                name="targetMarket"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Target Market (Optional)</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g., Small businesses, Millenials, Enterprise" {...field} />
                                                        </FormControl>
                                                        <FormDescription>
                                                            Specific customer segment you want to focus on
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Budget Range */}
                                            <FormField
                                                control={form.control}
                                                name="budgetRange"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Budget Range (Optional)</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select budget range" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {budgetOptions.map((budget) => (
                                                                    <SelectItem key={budget} value={budget}>
                                                                        {budget}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            {/* Timeline */}
                                            <FormField
                                                control={form.control}
                                                name="timeline"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Timeline (Optional)</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select timeline" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {timelineOptions.map((timeline) => (
                                                                    <SelectItem key={timeline} value={timeline}>
                                                                        {timeline}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Description */}
                                        <FormField
                                            control={form.control}
                                            name="description"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Describe Your Idea Vision</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="What problem do you want to solve? What market gap have you noticed?"
                                                            className="min-h-[120px]"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Be specific about the problem, market, or opportunity you see. Minimum 10 characters.
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Innovation Preferences */}
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-lg font-medium mb-2">Innovation Preferences</h3>
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    Select the types of innovation you're interested in exploring:
                                                </p>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-3">
                                                {preferenceOptions.map((pref) => {
                                                    const Icon = pref.icon
                                                    const isSelected = selectedPreferences.includes(pref.value)

                                                    return (
                                                        <motion.div
                                                            key={pref.value}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                        >
                                                            <Card
                                                                className={`cursor-pointer transition-all duration-200 ${isSelected
                                                                    ? 'border-primary bg-primary/5'
                                                                    : 'hover:border-primary/50'
                                                                    }`}
                                                                onClick={() => handlePreferenceToggle(pref.value)}
                                                            >
                                                                <CardContent className="p-4">
                                                                    <div className="flex items-start gap-3">
                                                                        <Icon className={`h-5 w-5 mt-0.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'
                                                                            }`} />
                                                                        <div className="flex-1">
                                                                            <h4 className="font-medium">{pref.label}</h4>
                                                                            <p className="text-sm text-muted-foreground">
                                                                                {pref.description}
                                                                            </p>
                                                                        </div>
                                                                        {isSelected && (
                                                                            <CheckCircle className="h-5 w-5 text-primary" />
                                                                        )}
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        </motion.div>
                                                    )
                                                })}
                                            </div>

                                            {selectedPreferences.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="text-sm font-medium">Selected:</span>
                                                    {selectedPreferences.map((pref) => {
                                                        const prefData = preferenceOptions.find(p => p.value === pref)
                                                        return (
                                                            <Badge key={pref} variant="secondary">
                                                                {prefData?.label}
                                                            </Badge>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Generation Progress */}
                                        {isGenerating && (
                                            <Alert>
                                                <Refresh className="h-4 w-4 animate-spin" />
                                                <AlertDescription>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-sm">
                                                            <span>{currentStep}</span>
                                                            <span>{generationProgress}%</span>
                                                        </div>
                                                        <Progress value={generationProgress} className="w-full" />
                                                    </div>
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        {/* Submit Button */}
                                        <Button
                                            type="submit"
                                            size="lg"
                                            disabled={isGenerating}
                                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <Refresh className="mr-2 h-4 w-4 animate-spin" />
                                                    Generating Your Idea...
                                                </>
                                            ) : (
                                                <>
                                                    <AutoAwesome className="mr-2 h-4 w-4" />
                                                    Generate Blue Ocean Idea
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">💡 Example Prompts</CardTitle>
                                <CardDescription>
                                    Click on any example to use it as a starting point
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {examplePrompts.map((prompt, index) => (
                                        <motion.div
                                            key={index}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <Card
                                                className="cursor-pointer hover:border-primary/50 transition-colors"
                                                onClick={() => handleExampleClick(prompt)}
                                            >
                                                <CardContent className="p-3">
                                                    <p className="text-sm">"{prompt}"</p>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">🎯 How It Works</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ol className="space-y-3 text-sm">
                                    <li className="flex gap-2">
                                        <span className="font-medium text-primary">1.</span>
                                        <span>Describe your market vision or problem</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-medium text-primary">2.</span>
                                        <span>AI analyzes market gaps and trends</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-medium text-primary">3.</span>
                                        <span>Blue Ocean Strategy identifies uncontested spaces</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-medium text-primary">4.</span>
                                        <span>Multi-agent system crafts breakthrough concepts</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-medium text-primary">5.</span>
                                        <span>Market research validates opportunities</span>
                                    </li>
                                </ol>

                                <Alert className="mt-4">
                                    <Lightbulb className="h-4 w-4" />
                                    <AlertDescription className="text-sm">
                                        <strong>Pro Tip:</strong> Focus on problems that frustrate you personally
                                        or gaps you've observed in your industry for best results.
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
