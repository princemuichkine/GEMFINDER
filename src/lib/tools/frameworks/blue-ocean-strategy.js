class BlueOceanStrategy {
    constructor() {
        this.framework = {
            name: "Blue Ocean Strategy",
            focus: "Create uncontested market space",
            keyPrinciples: [
                "Reconstruct market boundaries",
                "Focus on the big picture",
                "Reach beyond existing demand",
                "Get the strategic sequence right",
                "Overcome organizational hurdles"
            ]
        };
    }

    async analyzeMarketBoundaries(industry, competitors) {
        return {
            currentBoundaries: this.identifyCurrentBoundaries(industry),
            reconstructionOpportunities: this.findReconstructionOpportunities(competitors),
            newMarketSpaces: this.createNewMarketSpaces(industry)
        };
    }

    identifyCurrentBoundaries(industry) {
        const boundaries = {
            industry: industry,
            buyer_groups: this.identifyBuyerGroups(industry),
            scope_of_products_services: this.identifyProductScope(industry),
            functional_emotional_appeal: this.identifyAppealOrientation(industry),
            time: this.identifyTimeBoundaries(industry)
        };

        return boundaries;
    }

    identifyBuyerGroups(industry) {
        const buyerGroups = {
            'technology': ['consumers', 'small_businesses', 'enterprises', 'developers'],
            'healthcare': ['patients', 'providers', 'payers', 'pharmaceuticals'],
            'finance': ['individuals', 'small_businesses', 'corporations', 'institutions'],
            'education': ['students', 'teachers', 'administrators', 'parents'],
            'retail': ['consumers', 'small_businesses', 'wholesalers', 'manufacturers']
        };

        return buyerGroups[industry.toLowerCase()] || ['primary_users', 'intermediaries', 'influencers'];
    }

    identifyProductScope(industry) {
        const scopes = {
            'technology': ['hardware', 'software', 'services', 'platforms'],
            'healthcare': ['prevention', 'diagnosis', 'treatment', 'recovery'],
            'finance': ['payments', 'lending', 'investing', 'insurance'],
            'education': ['content', 'delivery', 'assessment', 'certification'],
            'retail': ['products', 'services', 'experiences', 'platforms']
        };

        return scopes[industry.toLowerCase()] || ['core_offering', 'complements', 'adjacencies'];
    }

    identifyAppealOrientation(industry) {
        return {
            functional: `Practical benefits in ${industry}`,
            emotional: `Psychological benefits in ${industry}`,
            social: `Social status benefits in ${industry}`
        };
    }

    identifyTimeBoundaries(industry) {
        return {
            current: `Traditional ${industry} business cycles`,
            emerging: `New ${industry} opportunity windows`,
            future: `Long-term ${industry} transformation trends`
        };
    }

    findReconstructionOpportunities(competitors) {
        const opportunities = [];

        // Look across alternative industries
        opportunities.push({
            type: 'alternative_industries',
            opportunities: this.analyzeAlternativeIndustries(competitors)
        });

        // Look across strategic groups
        opportunities.push({
            type: 'strategic_groups',
            opportunities: this.analyzeStrategicGroups(competitors)
        });

        // Look across buyer groups
        opportunities.push({
            type: 'buyer_groups',
            opportunities: this.analyzeBuyerGroups(competitors)
        });

        // Look across complementary products
        opportunities.push({
            type: 'complementary_products',
            opportunities: this.analyzeComplementaryProducts(competitors)
        });

        // Look across functional/emotional appeal
        opportunities.push({
            type: 'appeal_orientation',
            opportunities: this.analyzeAppealOrientation(competitors)
        });

        return opportunities;
    }

    analyzeAlternativeIndustries(competitors) {
        const industries = competitors.map(c => c.industry).filter((v, i, a) => a.indexOf(v) === i);
        const opportunities = [];

        industries.forEach(industry => {
            opportunities.push({
                from: industry,
                to: `non-${industry}`,
                opportunity: `Apply ${industry} solutions to adjacent problems`,
                value: `Cross-industry innovation potential`
            });
        });

        return opportunities;
    }

    analyzeStrategicGroups(competitors) {
        const strategicGroups = this.groupCompetitorsByStrategy(competitors);
        const opportunities = [];

        Object.keys(strategicGroups).forEach(group => {
            opportunities.push({
                group: group,
                opportunity: `Serve customers who find ${group} offerings inadequate`,
                value: `Underserved segment identification`
            });
        });

        return opportunities;
    }

    analyzeBuyerGroups(competitors) {
        const buyerGroups = ['end_users', 'intermediaries', 'influencers', 'non_customers'];
        const opportunities = [];

        buyerGroups.forEach(group => {
            if (!competitors.some(c => c.target_buyer_group === group)) {
                opportunities.push({
                    buyer_group: group,
                    opportunity: `Create offerings specifically for ${group}`,
                    value: `New market segment creation`
                });
            }
        });

        return opportunities;
    }

    analyzeComplementaryProducts(competitors) {
        const opportunities = [];

        competitors.forEach(competitor => {
            opportunities.push({
                competitor: competitor.name,
                opportunity: `Integrate with or replace ${competitor.name}'s complementary offerings`,
                value: `Ecosystem disruption potential`
            });
        });

        return opportunities;
    }

    analyzeAppealOrientation(competitors) {
        const orientations = ['functional', 'emotional', 'social'];
        const opportunities = [];

        orientations.forEach(orientation => {
            const competitorsWithOrientation = competitors.filter(c =>
                c.appeal_orientation === orientation
            );

            if (competitorsWithOrientation.length === 0) {
                opportunities.push({
                    orientation: orientation,
                    opportunity: `Be the first to focus on ${orientation} appeal`,
                    value: `Differentiation through unique value proposition`
                });
            }
        });

        return opportunities;
    }

    groupCompetitorsByStrategy(competitors) {
        const groups = {};

        competitors.forEach(competitor => {
            const strategy = competitor.strategy || 'traditional';
            if (!groups[strategy]) {
                groups[strategy] = [];
            }
            groups[strategy].push(competitor);
        });

        return groups;
    }

    createNewMarketSpaces(industry) {
        const spaces = [];

        // Six Paths Framework application
        spaces.push({
            path: 'path_1_alternative_industries',
            spaces: this.path1AlternativeIndustries(industry)
        });

        spaces.push({
            path: 'path_2_strategic_groups',
            spaces: this.path2StrategicGroups(industry)
        });

        spaces.push({
            path: 'path_3_buyer_groups',
            spaces: this.path3BuyerGroups(industry)
        });

        spaces.push({
            path: 'path_4_complementary_products',
            spaces: this.path4ComplementaryProducts(industry)
        });

        spaces.push({
            path: 'path_5_functional_emotional',
            spaces: this.path5FunctionalEmotional(industry)
        });

        spaces.push({
            path: 'path_6_time',
            spaces: this.path6Time(industry)
        });

        return spaces;
    }

    path1AlternativeIndustries(industry) {
        const alternatives = {
            'technology': ['education', 'healthcare', 'finance'],
            'healthcare': ['wellness', 'nutrition', 'fitness'],
            'finance': ['education', 'real_estate', 'insurance'],
            'education': ['corporate_training', 'skill_development', 'entertainment'],
            'retail': ['services', 'experiences', 'platforms']
        };

        return alternatives[industry.toLowerCase()] || ['adjacent_industries'];
    }

    path2StrategicGroups(industry) {
        const groups = {
            'technology': ['enterprise_focused', 'consumer_focused', 'platform_based', 'product_based'],
            'healthcare': ['preventive', 'curative', 'holistic', 'specialized'],
            'finance': ['traditional_banking', 'fintech', 'investment', 'payments'],
            'education': ['formal', 'informal', 'corporate', 'self_paced'],
            'retail': ['offline_only', 'online_only', 'omnichannel', 'marketplace']
        };

        return groups[industry.toLowerCase()] || ['different_strategic_approaches'];
    }

    path3BuyerGroups(industry) {
        const groups = {
            'technology': ['non_technical_users', 'small_businesses', 'enterprises', 'developers'],
            'healthcare': ['healthy_individuals', 'patients', 'caregivers', 'providers'],
            'finance': ['unbanked', 'underserved', 'high_net_worth', 'small_businesses'],
            'education': ['non_traditional_students', 'professionals', 'corporations', 'parents'],
            'retail': ['non_consumers', 'businesses', 'institutions', 'resellers']
        };

        return groups[industry.toLowerCase()] || ['untapped_buyer_segments'];
    }

    path4ComplementaryProducts(industry) {
        const complements = {
            'technology': ['consulting', 'training', 'integration', 'support'],
            'healthcare': ['nutrition', 'fitness', 'mental_health', 'prevention'],
            'finance': ['education', 'tax_services', 'investment_advice', 'insurance'],
            'education': ['career_services', 'certification', 'networking', 'mentorship'],
            'retail': ['delivery', 'installation', 'maintenance', 'financing']
        };

        return complements[industry.toLowerCase()] || ['complementary_services'];
    }

    path5FunctionalEmotional(industry) {
        return {
            functional_focus: `Practical solutions for ${industry} problems`,
            emotional_focus: `Emotional benefits in ${industry} context`,
            social_focus: `Social status and belonging in ${industry}`
        };
    }

    path6Time(industry) {
        return {
            current_trends: `Capitalize on current ${industry} shifts`,
            future_opportunities: `Position for future ${industry} developments`,
            cyclical_opportunities: `Address ${industry} business cycle gaps`
        };
    }

    createStrategicCanvas(currentCompetitors, newOffering) {
        const factors = this.identifyKeyFactors(currentCompetitors);
        const canvas = {
            factors: factors,
            current_competitors: {},
            new_offering: {}
        };

        // Populate current competitor offerings
        currentCompetitors.forEach(competitor => {
            canvas.current_competitors[competitor.name] = {};
            factors.forEach(factor => {
                canvas.current_competitors[competitor.name][factor] =
                    competitor[factor] || 'low';
            });
        });

        // Define new offering value curve
        factors.forEach(factor => {
            if (newOffering.eliminate && newOffering.eliminate.includes(factor)) {
                canvas.new_offering[factor] = 'eliminated';
            } else if (newOffering.reduce && newOffering.reduce.includes(factor)) {
                canvas.new_offering[factor] = 'reduced';
            } else if (newOffering.raise && newOffering.raise.includes(factor)) {
                canvas.new_offering[factor] = 'raised';
            } else if (newOffering.create && newOffering.create.includes(factor)) {
                canvas.new_offering[factor] = 'created';
            } else {
                canvas.new_offering[factor] = 'standard';
            }
        });

        return canvas;
    }

    identifyKeyFactors(competitors) {
        const allFactors = new Set();

        competitors.forEach(competitor => {
            Object.keys(competitor).forEach(key => {
                if (key !== 'name' && key !== 'industry' && typeof competitor[key] === 'string') {
                    allFactors.add(key);
                }
            });
        });

        return Array.from(allFactors);
    }

    validateBlueOceanOpportunity(offering) {
        const validation = {
            is_blue_ocean: false,
            reasons: [],
            recommendations: []
        };

        // Check if it creates new demand
        if (offering.new_market_space) {
            validation.reasons.push('Creates new market space');
            validation.is_blue_ocean = true;
        }

        // Check if it breaks industry boundaries
        if (offering.boundary_breaking) {
            validation.reasons.push('Breaks traditional industry boundaries');
            validation.is_blue_ocean = true;
        }

        // Check if it targets non-customers
        if (offering.non_customer_targeting) {
            validation.reasons.push('Targets non-traditional customer segments');
            validation.is_blue_ocean = true;
        }

        // Check value innovation
        if (offering.value_innovation) {
            validation.reasons.push('Demonstrates clear value innovation');
            validation.is_blue_ocean = true;
        }

        if (!validation.is_blue_ocean) {
            validation.recommendations.push('Focus on creating uncontested market space');
            validation.recommendations.push('Target customers not currently being served');
            validation.recommendations.push('Break industry boundary assumptions');
            validation.recommendations.push('Create exceptional value through innovation');
        }

        return validation;
    }
}

module.exports = BlueOceanStrategy;
