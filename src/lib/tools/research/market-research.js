const axios = require('axios');

class MarketResearchIntegrator {
    constructor() {
        this.apis = {
            crunchbase: {
                baseUrl: 'https://api.crunchbase.com/api/v4',
                key: process.env.CRUNCHBASE_API_KEY
            },
            similarweb: {
                baseUrl: 'https://api.similarweb.com/v1',
                key: process.env.SIMILARWEB_API_KEY
            },
            appannie: {
                baseUrl: 'https://api.appannie.com/v2',
                key: process.env.APPANNIE_API_KEY
            },
            statista: {
                baseUrl: 'https://api.statista.com',
                key: process.env.STATISTA_API_KEY
            },
            googleTrends: {
                baseUrl: 'https://trends.google.com/trends/api',
                key: process.env.GOOGLE_TRENDS_API_KEY
            },
            semrush: {
                baseUrl: 'https://api.semrush.com',
                key: process.env.SEMRUSH_API_KEY
            }
        };

        this.cache = new Map();
        this.cacheTimeout = 3600000; // 1 hour
    }

    async analyzeMarketOpportunity(industry, concept) {
        const analysis = {
            marketSize: await this.getMarketSize(industry),
            growthRate: await this.getGrowthRate(industry),
            competition: await this.analyzeCompetition(industry, concept),
            trends: await this.getMarketTrends(industry),
            customerInsights: await this.getCustomerInsights(industry),
            technologicalFeasibility: await this.assessTechFeasibility(concept),
            regulatoryLandscape: await this.analyzeRegulatoryLandscape(industry),
            blueOceanPotential: await this.assessBlueOceanPotential(industry, concept)
        };

        return analysis;
    }

    async getMarketSize(industry) {
        try {
            // Try multiple data sources
            const sources = await Promise.allSettled([
                this.getCrunchbaseMarketSize(industry),
                this.getStatistaMarketSize(industry),
                this.getSimilarWebMarketSize(industry)
            ]);

            const validResults = sources
                .filter(result => result.status === 'fulfilled' && result.value)
                .map(result => result.value);

            if (validResults.length === 0) {
                return this.estimateMarketSize(industry);
            }

            // Average the results
            const averageSize = validResults.reduce((sum, size) => sum + size, 0) / validResults.length;

            return {
                size: averageSize,
                currency: 'USD',
                timeframe: 'annual',
                sources: validResults.length,
                confidence: Math.min(validResults.length * 0.3, 0.9)
            };

        } catch (error) {
            console.error('Error getting market size:', error);
            return this.estimateMarketSize(industry);
        }
    }

    async getCrunchbaseMarketSize(industry) {
        if (!this.apis.crunchbase.key) return null;

        const cacheKey = `crunchbase_market_${industry}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await axios.get(`${this.apis.crunchbase.baseUrl}/searches/funding_rounds`, {
                headers: { 'X-cb-user-key': this.apis.crunchbase.key },
                params: {
                    query: industry,
                    field_ids: ['raised_amount_usd', 'announced_on']
                }
            });

            const rounds = response.data.funding_rounds || [];
            const totalRaised = rounds.reduce((sum, round) => sum + (round.raised_amount_usd || 0), 0);

            const result = totalRaised * 10; // Rough market size estimation
            this.cache.set(cacheKey, result);
            return result;

        } catch (error) {
            console.error('Crunchbase API error:', error.message);
            return null;
        }
    }

    async getStatistaMarketSize(industry) {
        if (!this.apis.statista.key) return null;

        const cacheKey = `statista_market_${industry}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await axios.get(`${this.apis.statista.baseUrl}/markets/${industry}`, {
                headers: { 'Authorization': `Bearer ${this.apis.statista.key}` }
            });

            const result = response.data.market_size;
            this.cache.set(cacheKey, result);
            return result;

        } catch (error) {
            console.error('Statista API error:', error.message);
            return null;
        }
    }

    async getSimilarWebMarketSize(industry) {
        if (!this.apis.similarweb.key) return null;

        const cacheKey = `similarweb_market_${industry}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            // Get top websites in industry
            const response = await axios.get(`${this.apis.similarweb.baseUrl}/websites/list`, {
                headers: { 'api-key': this.apis.similarweb.key },
                params: { category: industry, limit: 10 }
            });

            const websites = response.data.websites || [];
            let totalTraffic = 0;

            // Get traffic data for each website
            for (const website of websites.slice(0, 5)) {
                try {
                    const trafficResponse = await axios.get(
                        `${this.apis.similarweb.baseUrl}/website/${website.domain}/traffic`,
                        { headers: { 'api-key': this.apis.similarweb.key } }
                    );
                    totalTraffic += trafficResponse.data.visits || 0;
                } catch (trafficError) {
                    console.error(`Error getting traffic for ${website.domain}:`, trafficError.message);
                }
            }

            // Estimate market size based on traffic (rough calculation)
            const result = totalTraffic * 100; // $100 per visitor per year estimate
            this.cache.set(cacheKey, result);
            return result;

        } catch (error) {
            console.error('SimilarWeb API error:', error.message);
            return null;
        }
    }

    estimateMarketSize(industry) {
        // Fallback estimation based on industry averages
        const industryMultipliers = {
            'technology': 500000000000,  // $500B
            'healthcare': 8000000000000, // $8T
            'finance': 3000000000000,   // $3T
            'education': 2000000000000, // $2T
            'retail': 25000000000000,   // $25T
            'manufacturing': 15000000000000, // $15T
            'energy': 6000000000000,    // $6T
            'transportation': 8000000000000, // $8T
            'entertainment': 2000000000000, // $2T
            'agriculture': 5000000000000   // $5T
        };

        return {
            size: industryMultipliers[industry.toLowerCase()] || 100000000000, // $100B default
            currency: 'USD',
            timeframe: 'annual',
            sources: 0,
            confidence: 0.1,
            estimated: true
        };
    }

    async getGrowthRate(industry) {
        try {
            const trends = await this.getGoogleTrendsData(industry);
            const historicalData = trends ? this.calculateGrowthFromTrends(trends) : null;

            return {
                rate: historicalData || this.estimateGrowthRate(industry),
                timeframe: 'annual',
                source: trends ? 'google_trends' : 'industry_average',
                confidence: trends ? 0.7 : 0.3
            };
        } catch (error) {
            console.error('Error getting growth rate:', error);
            return {
                rate: this.estimateGrowthRate(industry),
                timeframe: 'annual',
                source: 'estimation',
                confidence: 0.2
            };
        }
    }

    async getGoogleTrendsData(keyword) {
        if (!this.apis.googleTrends.key) return null;

        const cacheKey = `google_trends_${keyword}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await axios.get(`${this.apis.googleTrends.baseUrl}/widgetdata/multiline`, {
                params: {
                    keyword: keyword,
                    timeframe: 'today 12-m',
                    geo: 'US'
                },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const result = response.data.default.timelineData;
            this.cache.set(cacheKey, result);
            return result;

        } catch (error) {
            console.error('Google Trends API error:', error.message);
            return null;
        }
    }

    calculateGrowthFromTrends(trendsData) {
        if (!trendsData || trendsData.length < 2) return null;

        const values = trendsData.map(point => point.value[0]);
        const recentAvg = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
        const earlierAvg = values.slice(0, 3).reduce((a, b) => a + b, 0) / 3;

        if (earlierAvg === 0) return 0;

        return ((recentAvg - earlierAvg) / earlierAvg) * 100;
    }

    estimateGrowthRate(industry) {
        const industryGrowthRates = {
            'technology': 8.5,
            'healthcare': 5.2,
            'finance': 4.8,
            'education': 6.1,
            'retail': 3.2,
            'manufacturing': 2.8,
            'energy': 1.5,
            'transportation': 4.9,
            'entertainment': 7.2,
            'agriculture': 2.1
        };

        return industryGrowthRates[industry.toLowerCase()] || 4.0;
    }

    async analyzeCompetition(industry, concept) {
        try {
            const crunchbaseCompetitors = await this.getCrunchbaseCompetitors(industry);
            const appAnnieCompetitors = await this.getAppAnnieCompetitors(concept);
            const semrushCompetitors = await this.getSemrushCompetitors(concept);

            return {
                direct_competitors: crunchbaseCompetitors || [],
                indirect_competitors: appAnnieCompetitors || [],
                keyword_competitors: semrushCompetitors || [],
                market_saturation: this.calculateMarketSaturation([
                    ...(crunchbaseCompetitors || []),
                    ...(appAnnieCompetitors || []),
                    ...(semrushCompetitors || [])
                ]),
                blue_ocean_potential: this.assessCompetitionGaps([
                    ...(crunchbaseCompetitors || []),
                    ...(appAnnieCompetitors || []),
                    ...(semrushCompetitors || [])
                ], concept)
            };
        } catch (error) {
            console.error('Error analyzing competition:', error);
            return {
                direct_competitors: [],
                indirect_competitors: [],
                keyword_competitors: [],
                market_saturation: 'unknown',
                blue_ocean_potential: 'high'
            };
        }
    }

    async getCrunchbaseCompetitors(industry) {
        if (!this.apis.crunchbase.key) return null;

        const cacheKey = `crunchbase_competitors_${industry}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await axios.get(`${this.apis.crunchbase.baseUrl}/searches/organizations`, {
                headers: { 'X-cb-user-key': this.apis.crunchbase.key },
                params: {
                    query: industry,
                    field_ids: ['name', 'short_description', 'funding_total_usd', 'founded_on']
                }
            });

            const competitors = response.data.organizations?.slice(0, 20) || [];
            this.cache.set(cacheKey, competitors);
            return competitors;

        } catch (error) {
            console.error('Crunchbase competitors error:', error.message);
            return null;
        }
    }

    async getAppAnnieCompetitors(concept) {
        if (!this.apis.appannie.key) return null;

        const cacheKey = `appannie_competitors_${concept}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await axios.get(`${this.apis.appannie.baseUrl}/apps/google-play/top-chart`, {
                headers: { 'Authorization': `Bearer ${this.apis.appannie.key}` },
                params: {
                    category: this.mapConceptToCategory(concept),
                    country: 'US',
                    limit: 10
                }
            });

            const competitors = response.data.app_list || [];
            this.cache.set(cacheKey, competitors);
            return competitors;

        } catch (error) {
            console.error('App Annie competitors error:', error.message);
            return null;
        }
    }

    async getSemrushCompetitors(concept) {
        if (!this.apis.semrush.key) return null;

        const cacheKey = `semrush_competitors_${concept}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await axios.get(`${this.apis.semrush.baseUrl}/domain_organic`, {
                params: {
                    key: this.apis.semrush.key,
                    domain: this.extractDomainFromConcept(concept),
                    database: 'us',
                    display_limit: 10
                }
            });

            const competitors = response.data.data || [];
            this.cache.set(cacheKey, competitors);
            return competitors;

        } catch (error) {
            console.error('SEMrush competitors error:', error.message);
            return null;
        }
    }

    calculateMarketSaturation(competitors) {
        const totalCompetitors = competitors.length;

        if (totalCompetitors === 0) return 'low';
        if (totalCompetitors < 10) return 'medium';
        if (totalCompetitors < 50) return 'high';
        return 'very_high';
    }

    assessCompetitionGaps(competitors, concept) {
        // Analyze if there are obvious gaps in the competitive landscape
        const offerings = competitors.map(c => c.description || c.name).join(' ').toLowerCase();
        const conceptWords = concept.toLowerCase().split(' ');

        const uniqueWords = conceptWords.filter(word =>
            word.length > 3 && !offerings.includes(word)
        );

        if (uniqueWords.length > conceptWords.length * 0.5) {
            return 'high'; // Many unique aspects = potential blue ocean
        } else if (uniqueWords.length > conceptWords.length * 0.2) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    async getMarketTrends(industry) {
        try {
            const trends = await this.getGoogleTrendsData(industry);
            const relatedQueries = await this.getRelatedQueries(industry);

            return {
                search_trends: trends ? this.processTrendsData(trends) : [],
                related_queries: relatedQueries || [],
                emerging_keywords: this.extractEmergingKeywords(relatedQueries),
                trend_direction: this.analyzeTrendDirection(trends)
            };
        } catch (error) {
            console.error('Error getting market trends:', error);
            return {
                search_trends: [],
                related_queries: [],
                emerging_keywords: [],
                trend_direction: 'stable'
            };
        }
    }

    async getRelatedQueries(keyword) {
        if (!this.apis.googleTrends.key) return null;

        const cacheKey = `related_queries_${keyword}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await axios.get(`${this.apis.googleTrends.baseUrl}/widgetdata/relatedsearches`, {
                params: { keyword: keyword, geo: 'US' },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const result = response.data.default.rankedList[0].rankedKeyword;
            this.cache.set(cacheKey, result);
            return result;

        } catch (error) {
            console.error('Related queries error:', error.message);
            return null;
        }
    }

    processTrendsData(trendsData) {
        return trendsData.map(point => ({
            date: point.time,
            value: point.value[0],
            formattedTime: point.formattedTime
        }));
    }

    extractEmergingKeywords(relatedQueries) {
        if (!relatedQueries) return [];

        return relatedQueries
            .filter(query => query.value > 50) // High search volume
            .slice(0, 10)
            .map(query => query.query);
    }

    analyzeTrendDirection(trends) {
        if (!trends || trends.length < 2) return 'stable';

        const recent = trends.slice(-3);
        const earlier = trends.slice(0, 3);

        const recentAvg = recent.reduce((sum, point) => sum + point.value[0], 0) / recent.length;
        const earlierAvg = earlier.reduce((sum, point) => sum + point.value[0], 0) / earlier.length;

        const change = (recentAvg - earlierAvg) / earlierAvg;

        if (change > 0.1) return 'increasing';
        if (change < -0.1) return 'decreasing';
        return 'stable';
    }

    async getCustomerInsights(industry) {
        // This would integrate with customer research APIs
        // For now, return structured insights framework
        return {
            pain_points: await this.identifyCustomerPainPoints(industry),
            unmet_needs: await this.identifyUnmetNeeds(industry),
            buying_behavior: await this.analyzeBuyingBehavior(industry),
            decision_factors: await this.identifyDecisionFactors(industry)
        };
    }

    async identifyCustomerPainPoints(industry) {
        // Would integrate with customer feedback APIs, surveys, etc.
        const painPoints = {
            'technology': ['complexity', 'integration issues', 'high costs', 'lack of support'],
            'healthcare': ['long wait times', 'high costs', 'limited access', 'quality concerns'],
            'finance': ['fees', 'complexity', 'trust issues', 'limited access'],
            'education': ['high costs', 'limited flexibility', 'quality variation', 'outdated content'],
            'retail': ['shipping costs', 'returns', 'product quality', 'customer service']
        };

        return painPoints[industry.toLowerCase()] || ['general_dissatisfaction'];
    }

    async identifyUnmetNeeds(industry) {
        const unmetNeeds = {
            'technology': ['seamless integration', 'predictive support', 'personalization'],
            'healthcare': ['preventive care access', 'remote monitoring', 'holistic approaches'],
            'finance': ['financial education', 'micro-investing', 'automated savings'],
            'education': ['skill-based learning', 'personalized paths', 'industry connections'],
            'retail': ['sustainable options', 'local sourcing', 'experience integration']
        };

        return unmetNeeds[industry.toLowerCase()] || ['innovation_opportunities'];
    }

    async analyzeBuyingBehavior(industry) {
        return {
            decision_makers: this.identifyDecisionMakers(industry),
            purchase_channels: this.identifyPurchaseChannels(industry),
            price_sensitivity: this.assessPriceSensitivity(industry),
            loyalty_factors: this.identifyLoyaltyFactors(industry)
        };
    }

    async identifyDecisionFactors(industry) {
        const factors = {
            'technology': ['functionality', 'ease_of_use', 'support', 'integration'],
            'healthcare': ['quality', 'accessibility', 'cost', 'reputation'],
            'finance': ['trust', 'returns', 'fees', 'convenience'],
            'education': ['quality', 'flexibility', 'cost', 'outcomes'],
            'retail': ['price', 'quality', 'convenience', 'brand']
        };

        return factors[industry.toLowerCase()] || ['value', 'quality', 'service'];
    }

    async assessTechFeasibility(concept) {
        // Assess technical feasibility of the concept
        return {
            technology_readiness: this.assessTechnologyReadiness(concept),
            development_complexity: this.assessDevelopmentComplexity(concept),
            scalability: this.assessScalability(concept),
            integration_requirements: this.identifyIntegrationRequirements(concept)
        };
    }

    async analyzeRegulatoryLandscape(industry) {
        // Analyze regulatory considerations
        return {
            key_regulations: this.identifyKeyRegulations(industry),
            compliance_requirements: this.identifyComplianceRequirements(industry),
            certification_needs: this.identifyCertificationNeeds(industry),
            risk_factors: this.identifyRegulatoryRisks(industry)
        };
    }

    async assessBlueOceanPotential(industry, concept) {
        const competition = await this.analyzeCompetition(industry, concept);
        const trends = await this.getMarketTrends(industry);
        const customerInsights = await this.getCustomerInsights(industry);

        return {
            market_gap_size: this.calculateMarketGap(competition, customerInsights),
            innovation_potential: this.assessInnovationPotential(concept, trends),
            competitive_advantage: this.assessCompetitiveAdvantage(concept, competition),
            scalability_potential: this.assessScalabilityPotential(concept),
            overall_potential: this.calculateOverallBlueOceanPotential({
                market_gap_size: this.calculateMarketGap(competition, customerInsights),
                innovation_potential: this.assessInnovationPotential(concept, trends),
                competitive_advantage: this.assessCompetitiveAdvantage(concept, competition),
                scalability_potential: this.assessScalabilityPotential(concept)
            })
        };
    }

    // Helper methods
    mapConceptToCategory(concept) {
        // Map concept keywords to app store categories
        const categoryMap = {
            'social': 'SOCIAL',
            'game': 'GAME',
            'business': 'BUSINESS',
            'education': 'EDUCATION',
            'health': 'HEALTH_AND_FITNESS'
        };

        const words = concept.toLowerCase().split(' ');
        for (const word of words) {
            if (categoryMap[word]) return categoryMap[word];
        }

        return 'BUSINESS'; // default
    }

    extractDomainFromConcept(concept) {
        // Extract potential domain from concept
        const words = concept.toLowerCase().split(' ');
        return words.slice(0, 2).join('') + '.com';
    }

    identifyDecisionMakers(industry) {
        const decisionMakers = {
            'technology': ['CTO', 'IT Manager', 'End User'],
            'healthcare': ['Patient', 'Doctor', 'Administrator'],
            'finance': ['Individual', 'Financial Advisor', 'CFO'],
            'education': ['Student', 'Parent', 'Administrator'],
            'retail': ['Consumer', 'Purchasing Manager', 'Owner']
        };

        return decisionMakers[industry.toLowerCase()] || ['end_user'];
    }

    identifyPurchaseChannels(industry) {
        const channels = {
            'technology': ['direct', 'resellers', 'online_marketplaces'],
            'healthcare': ['providers', 'insurance', 'direct'],
            'finance': ['banks', 'advisors', 'direct'],
            'education': ['schools', 'employers', 'direct'],
            'retail': ['stores', 'online', 'wholesale']
        };

        return channels[industry.toLowerCase()] || ['direct', 'online'];
    }

    assessPriceSensitivity(industry) {
        const sensitivity = {
            'technology': 'medium',
            'healthcare': 'low',
            'finance': 'medium',
            'education': 'medium',
            'retail': 'high'
        };

        return sensitivity[industry.toLowerCase()] || 'medium';
    }

    identifyLoyaltyFactors(industry) {
        const factors = {
            'technology': ['reliability', 'support', 'integration'],
            'healthcare': ['quality', 'trust', 'outcomes'],
            'finance': ['performance', 'trust', 'service'],
            'education': ['outcomes', 'reputation', 'flexibility'],
            'retail': ['convenience', 'value', 'experience']
        };

        return factors[industry.toLowerCase()] || ['quality', 'service'];
    }

    assessTechnologyReadiness(concept) {
        // Assess if required technologies exist
        const techIndicators = ['AI', 'blockchain', 'IoT', 'cloud', 'mobile'];
        const conceptText = concept.toLowerCase();

        const existingTech = techIndicators.filter(tech =>
            conceptText.includes(tech.toLowerCase())
        );

        if (existingTech.length === 0) return 'high';
        return 'medium'; // Assuming established tech is used
    }

    assessDevelopmentComplexity(concept) {
        const complexityIndicators = ['integration', 'multiple platforms', 'real-time', 'AI'];
        const conceptText = concept.toLowerCase();

        const complexityFactors = complexityIndicators.filter(factor =>
            conceptText.includes(factor)
        );

        if (complexityFactors.length > 2) return 'high';
        if (complexityFactors.length > 0) return 'medium';
        return 'low';
    }

    assessScalability(concept) {
        const scalabilityIndicators = ['cloud', 'platform', 'network', 'marketplace'];
        const conceptText = concept.toLowerCase();

        const scalabilityFactors = scalabilityIndicators.filter(factor =>
            conceptText.includes(factor)
        );

        if (scalabilityFactors.length > 0) return 'high';
        return 'medium';
    }

    identifyIntegrationRequirements(concept) {
        const integrationPoints = ['APIs', 'third-party', 'existing systems', 'platforms'];
        const conceptText = concept.toLowerCase();

        return integrationPoints.filter(point =>
            conceptText.includes(point.toLowerCase().replace(' ', '_'))
        );
    }

    identifyKeyRegulations(industry) {
        const regulations = {
            'technology': ['data privacy', 'GDPR', 'security standards'],
            'healthcare': ['HIPAA', 'FDA regulations', 'patient privacy'],
            'finance': ['SEC regulations', 'AML', 'consumer protection'],
            'education': ['FERPA', 'accessibility standards', 'content standards'],
            'retail': ['consumer protection', 'product safety', 'advertising standards']
        };

        return regulations[industry.toLowerCase()] || ['general_business_regulations'];
    }

    identifyComplianceRequirements(industry) {
        const requirements = {
            'technology': ['data encryption', 'audit trails', 'user consent'],
            'healthcare': ['patient consent', 'data security', 'clinical trials'],
            'finance': ['KYC', 'transaction monitoring', 'reporting'],
            'education': ['content accuracy', 'accessibility', 'age restrictions'],
            'retail': ['product labeling', 'return policies', 'advertising truth']
        };

        return requirements[industry.toLowerCase()] || ['basic_compliance'];
    }

    identifyCertificationNeeds(industry) {
        const certifications = {
            'technology': ['ISO 27001', 'SOC 2', 'GDPR compliance'],
            'healthcare': ['HIPAA compliance', 'FDA approval', 'clinical certifications'],
            'finance': ['FINRA licenses', 'SEC registration', 'insurance licenses'],
            'education': ['accreditation', 'quality standards', 'accessibility certification'],
            'retail': ['quality certifications', 'safety standards', 'sustainability certifications']
        };

        return certifications[industry.toLowerCase()] || [];
    }

    identifyRegulatoryRisks(industry) {
        const risks = {
            'technology': ['data breaches', 'privacy violations', 'platform liability'],
            'healthcare': ['patient harm', 'misdiagnosis liability', 'data breaches'],
            'finance': ['fraud', 'market manipulation', 'customer fund loss'],
            'education': ['content liability', 'student privacy', 'outcome claims'],
            'retail': ['product liability', 'false advertising', 'customer data breaches']
        };

        return risks[industry.toLowerCase()] || ['general_liability'];
    }

    calculateMarketGap(competition, customerInsights) {
        const saturation = competition.market_saturation;
        const unmetNeeds = customerInsights.unmet_needs?.length || 0;

        const saturationScore = { low: 3, medium: 2, high: 1, very_high: 0 };
        const gapScore = saturationScore[saturation] + unmetNeeds;

        if (gapScore >= 4) return 'large';
        if (gapScore >= 2) return 'medium';
        return 'small';
    }

    assessInnovationPotential(concept, trends) {
        const emergingKeywords = trends.emerging_keywords || [];
        const conceptWords = concept.toLowerCase().split(' ');

        const matches = conceptWords.filter(word =>
            emergingKeywords.some(keyword => keyword.includes(word))
        );

        if (matches.length > conceptWords.length * 0.3) return 'high';
        if (matches.length > 0) return 'medium';
        return 'low';
    }

    assessCompetitiveAdvantage(concept, competition) {
        const blueOceanPotential = competition.blue_ocean_potential;

        if (blueOceanPotential === 'high') return 'strong';
        if (blueOceanPotential === 'medium') return 'moderate';
        return 'weak';
    }

    assessScalabilityPotential(concept) {
        const scalabilityIndicators = ['platform', 'network', 'marketplace', 'subscription'];
        const conceptText = concept.toLowerCase();

        const scalabilityFactors = scalabilityIndicators.filter(factor =>
            conceptText.includes(factor)
        );

        if (scalabilityFactors.length > 1) return 'high';
        if (scalabilityFactors.length > 0) return 'medium';
        return 'low';
    }

    calculateOverallBlueOceanPotential(factors) {
        const scores = {
            market_gap_size: { large: 3, medium: 2, small: 1 },
            innovation_potential: { high: 3, medium: 2, low: 1 },
            competitive_advantage: { strong: 3, moderate: 2, weak: 1 },
            scalability_potential: { high: 3, medium: 2, low: 1 }
        };

        const totalScore = Object.entries(factors).reduce((sum, [key, value]) => {
            return sum + (scores[key][value] || 0);
        }, 0);

        const maxScore = 12;

        if (totalScore >= maxScore * 0.8) return 'excellent';
        if (totalScore >= maxScore * 0.6) return 'good';
        if (totalScore >= maxScore * 0.4) return 'moderate';
        return 'low';
    }
}

module.exports = MarketResearchIntegrator;
