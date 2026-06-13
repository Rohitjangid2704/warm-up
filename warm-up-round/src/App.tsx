import { useState } from 'react'
import './App.css'

type DayType = 'weekday' | 'weekend'
type DietPreference = 'none' | 'vegetarian' | 'vegan' | 'low-carb' | 'gluten-free'
type PrepTime = 'quick' | 'moderate' | 'relaxed'

type Recipe = {
  id: string
  mealType: 'Breakfast' | 'Lunch' | 'Dinner'
  name: string
  ingredients: string[]
  baseCost: number
  dietTags: DietPreference[]
  prepTime: PrepTime
}

type MealPlanItem = {
  mealType: 'Breakfast' | 'Lunch' | 'Dinner'
  recipe: Recipe
  substitutions: string[]
}

type PlanResult = {
  meals: MealPlanItem[]
  groceryList: string[]
  totalCost: number
  isAffordable: boolean
  budgetMessage: string
}

const recipeData: Recipe[] = [
  {
    id: 'breakfast-toast',
    mealType: 'Breakfast',
    name: 'Avocado Toast with Egg',
    ingredients: ['bread', 'avocado', 'egg', 'olive oil', 'salt', 'pepper'],
    baseCost: 4.5,
    dietTags: ['vegetarian', 'low-carb'],
    prepTime: 'quick',
  },
  {
    id: 'breakfast-smoothie',
    mealType: 'Breakfast',
    name: 'Berry Smoothie Bowl',
    ingredients: ['frozen berries', 'banana', 'almond milk', 'granola', 'chia seeds'],
    baseCost: 5.0,
    dietTags: ['vegetarian', 'vegan', 'gluten-free'],
    prepTime: 'quick',
  },
  {
    id: 'lunch-bowl',
    mealType: 'Lunch',
    name: 'Veggie Grain Bowl',
    ingredients: ['quinoa', 'chickpeas', 'spinach', 'tomato', 'tahini', 'lemon'],
    baseCost: 7.0,
    dietTags: ['vegetarian', 'vegan', 'gluten-free'],
    prepTime: 'moderate',
  },
  {
    id: 'lunch-wrap',
    mealType: 'Lunch',
    name: 'Chicken Salad Wrap',
    ingredients: ['tortilla', 'chicken', 'lettuce', 'tomato', 'yogurt dressing'],
    baseCost: 8.5,
    dietTags: ['none'],
    prepTime: 'moderate',
  },
  {
    id: 'dinner-pasta',
    mealType: 'Dinner',
    name: 'Pasta Primavera',
    ingredients: ['pasta', 'zucchini', 'cherry tomatoes', 'parmesan', 'garlic', 'olive oil'],
    baseCost: 8.0,
    dietTags: ['vegetarian'],
    prepTime: 'relaxed',
  },
  {
    id: 'dinner-curry',
    mealType: 'Dinner',
    name: 'Lentil Curry',
    ingredients: ['lentils', 'coconut milk', 'curry paste', 'spinach', 'rice'],
    baseCost: 7.5,
    dietTags: ['vegetarian', 'vegan', 'gluten-free'],
    prepTime: 'relaxed',
  },
  {
    id: 'dinner-salmon',
    mealType: 'Dinner',
    name: 'Salmon & Roasted Veggies',
    ingredients: ['salmon', 'broccoli', 'potato', 'lemon', 'olive oil'],
    baseCost: 12.0,
    dietTags: ['none', 'gluten-free'],
    prepTime: 'relaxed',
  },
]

const substitutionMap: Record<string, string> = {
  chicken: 'tofu or beans',
  salmon: 'chickpeas or tofu',
  pasta: 'zucchini noodles or gluten-free pasta',
  bread: 'gluten-free bread',
  yogurt: 'dairy-free yogurt',
  'coconut milk': 'almond milk',
  granola: 'nuts and seeds',
  egg: 'tofu scramble',
}

const prepOrder: Record<PrepTime, number> = {
  quick: 1,
  moderate: 2,
  relaxed: 3,
}

function App() {
  const [dayType, setDayType] = useState<DayType>('weekday')
  const [budget, setBudget] = useState(30)
  const [dietPreference, setDietPreference] = useState<DietPreference>('none')
  const [prepTime, setPrepTime] = useState<PrepTime>('moderate')
  const [plan, setPlan] = useState<PlanResult | null>(null)

  const budgetFriendly = budget <= 20

  const chooseRecipe = (
    mealType: 'Breakfast' | 'Lunch' | 'Dinner',
  ): Recipe => {
    const candidates = recipeData
      .filter((recipe) => recipe.mealType === mealType)
      .filter((recipe) => prepOrder[recipe.prepTime] <= prepOrder[prepTime])
      .sort((a, b) => a.baseCost - b.baseCost)

    const preferred = candidates.filter((recipe) => {
      if (dietPreference === 'none') return true
      return recipe.dietTags.includes(dietPreference)
    })

    if (preferred.length > 0) {
      return preferred[Math.floor(Math.random() * preferred.length)]
    }

    return candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : recipeData.find((recipe) => recipe.mealType === mealType)!
  }

  const buildSubstitutions = (recipe: Recipe): string[] => {
    const suggestions: string[] = []

    if (dietPreference === 'vegetarian' || dietPreference === 'vegan') {
      recipe.ingredients.forEach((item) => {
        const lower = item.toLowerCase()
        if (lower.includes('chicken') || lower.includes('salmon')) {
          suggestions.push(`${item} → ${substitutionMap['chicken']}`)
        }
        if (lower.includes('yogurt') || lower.includes('egg')) {
          suggestions.push(`${item} → ${substitutionMap[lower.includes('egg') ? 'egg' : 'yogurt']}`)
        }
      })
    }

    if (dietPreference === 'gluten-free') {
      recipe.ingredients.forEach((item) => {
        const lower = item.toLowerCase()
        if (lower.includes('bread') || lower.includes('pasta') || lower.includes('tortilla')) {
          suggestions.push(`${item} → ${substitutionMap['pasta']}`)
        }
      })
    }

    if (dietPreference === 'low-carb') {
      recipe.ingredients.forEach((item) => {
        const lower = item.toLowerCase()
        if (lower.includes('rice') || lower.includes('pasta') || lower.includes('bread') || lower.includes('granola')) {
          suggestions.push(`${item} → ${substitutionMap['pasta']}`)
        }
      })
    }

    if (budgetFriendly && recipe.baseCost > 8) {
      suggestions.push('Swap one ingredient for a lower-cost protein like beans or lentils.')
    }

    return suggestions.filter((value, index, array) => array.indexOf(value) === index)
  }

  const mergeGroceryList = (meals: MealPlanItem[]) => {
    const items = meals.flatMap((meal) => meal.recipe.ingredients)
    return Array.from(new Set(items)).sort()
  }

  const generatePlan = () => {
    const mealTypes = ['Breakfast', 'Lunch', 'Dinner'] as const
    const meals: MealPlanItem[] = mealTypes.map((mealType) => {
      const recipe = chooseRecipe(mealType)
      return {
        mealType,
        recipe,
        substitutions: buildSubstitutions(recipe),
      }
    })

    const groceryList = mergeGroceryList(meals)
    const totalCost = meals.reduce((sum, meal) => sum + meal.recipe.baseCost, 0)
    const isAffordable = totalCost <= budget
    const budgetMessage = isAffordable
      ? `Your budget is good for this plan.`
      : `Your plan is over budget by $${(totalCost - budget).toFixed(2)}. Try more plant-based or quick recipes.`

    setPlan({ meals, groceryList, totalCost, isAffordable, budgetMessage })
  }

  return (
    <main className="app-shell">
      <header className="hero-panel">
        <div>
          <p className="eyebrow">Cooking To-Do List</p>
          <h1>Plan your meals for the day</h1>
          <p className="subtitle">
            Generate breakfast, lunch, dinner, grocery items, substitutions, and a budget check.
          </p>
        </div>
      </header>

      <section className="planner-grid">
        <form
          className="control-panel"
          onSubmit={(event) => {
            event.preventDefault()
            generatePlan()
          }}
        >
          <h2>Daily inputs</h2>

          <label>
            Day type
            <select value={dayType} onChange={(event) => setDayType(event.target.value as DayType)}>
              <option value="weekday">Weekday</option>
              <option value="weekend">Weekend</option>
            </select>
          </label>

          <label>
            Budget ($)
            <input
              type="number"
              min={10}
              value={budget}
              onChange={(event) => setBudget(Number(event.target.value))}
            />
          </label>

          <label>
            Dietary preference
            <select
              value={dietPreference}
              onChange={(event) => setDietPreference(event.target.value as DietPreference)}
            >
              <option value="none">No preference</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="low-carb">Low-carb</option>
              <option value="gluten-free">Gluten-free</option>
            </select>
          </label>

          <label>
            Preparation time
            <select value={prepTime} onChange={(event) => setPrepTime(event.target.value as PrepTime)}>
              <option value="quick">Quick (&lt; 15 min)</option>
              <option value="moderate">Moderate (15–30 min)</option>
              <option value="relaxed">Relaxed (&gt; 30 min)</option>
            </select>
          </label>

          <button type="submit" className="primary-button">
            Generate plan
          </button>
        </form>

        <section className="summary-panel">
          <div className="summary-card">
            <h2>Budget status</h2>
            <p>
              Budget: <strong>${budget.toFixed(2)}</strong>
            </p>
            <p>
              {plan ? (
                <span className={plan.isAffordable ? 'status-good' : 'status-warning'}>
                  {plan.budgetMessage}
                </span>
              ) : (
                'Fill in the form and generate your plan.'
              )}
            </p>
            {plan && (
              <p>
                Estimated total cost: <strong>${plan.totalCost.toFixed(2)}</strong>
              </p>
            )}
          </div>

          {plan && (
            <div className="summary-card">
              <h2>Grocery list</h2>
              <ul>
                {plan.groceryList.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </section>

      {plan && (
        <section className="results-panel">
          <div className="result-card">
            <h2>Meal Plan</h2>
            <div className="meal-list">
              {plan.meals.map((meal) => (
                <article key={meal.mealType} className="meal-item">
                  <h3>{meal.mealType}</h3>
                  <p className="recipe-name">{meal.recipe.name}</p>
                  <p className="recipe-meta">
                    Cost: ${meal.recipe.baseCost.toFixed(2)} • Prep: {meal.recipe.prepTime}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="result-card">
            <h2>Substitutions</h2>
            {plan.meals.some((meal) => meal.substitutions.length > 0) ? (
              plan.meals.flatMap((meal) => meal.substitutions.map((sub) => (
                <p key={`${meal.mealType}-${sub}`} className="sub-item">
                  <strong>{meal.mealType}:</strong> {sub}
                </p>
              )))
            ) : (
              <p>No substitutions needed for this plan.</p>
            )}
          </div>
        </section>
      )}
    </main>
  )
}

export default App
