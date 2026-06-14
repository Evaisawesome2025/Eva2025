"use client";
import { useState } from "react";

const recipes = [
  {
    id: "pancakes",
    title: "Fluffy Pancakes",
    emoji: "🥞",
    desc: "Light, fluffy breakfast pancakes.",
    time: "20 min",
    serves: "4",
    ingredients: [
      "1½ cups all-purpose flour",
      "3½ tsp baking powder",
      "1 tbsp sugar",
      "¼ tsp salt",
      "1¼ cups milk",
      "1 egg",
      "3 tbsp melted butter",
    ],
    steps: [
      "In a large bowl, whisk together the flour, baking powder, sugar and salt.",
      "Make a well in the center and pour in the milk, egg and melted butter. Mix until smooth.",
      "Heat a lightly oiled griddle or non-stick pan over medium-high heat.",
      "Pour about ¼ cup of batter per pancake onto the griddle.",
      "Cook until bubbles form on the surface, then flip and cook until golden brown.",
      "Serve warm with syrup, butter or fresh fruit.",
    ],
  },
  {
    id: "spaghetti",
    title: "Spaghetti Bolognese",
    emoji: "🍝",
    desc: "Classic Italian meat sauce over pasta.",
    time: "45 min",
    serves: "4",
    ingredients: [
      "400g spaghetti",
      "500g ground beef",
      "1 onion, finely chopped",
      "2 cloves garlic, minced",
      "1 can (400g) crushed tomatoes",
      "2 tbsp tomato paste",
      "1 tsp dried oregano",
      "Salt, pepper and olive oil",
      "Parmesan cheese to serve",
    ],
    steps: [
      "Heat olive oil in a large pan and cook the onion until soft, about 5 minutes.",
      "Add the garlic and ground beef, breaking it up, and brown for 6–8 minutes.",
      "Stir in the tomato paste, crushed tomatoes and oregano. Season with salt and pepper.",
      "Simmer gently for 20 minutes, stirring occasionally, until thickened.",
      "Meanwhile, cook the spaghetti in salted boiling water until al dente, then drain.",
      "Serve the sauce over the spaghetti and top with grated Parmesan.",
    ],
  },
  {
    id: "guacamole",
    title: "Fresh Guacamole",
    emoji: "🥑",
    desc: "Creamy avocado dip with a zing.",
    time: "10 min",
    serves: "6",
    ingredients: [
      "3 ripe avocados",
      "1 lime, juiced",
      "½ tsp salt",
      "½ red onion, finely diced",
      "1 small tomato, diced",
      "2 tbsp chopped cilantro",
      "1 clove garlic, minced",
    ],
    steps: [
      "Halve the avocados, remove the pits and scoop the flesh into a bowl.",
      "Add the lime juice and salt, then mash to your preferred consistency.",
      "Fold in the red onion, tomato, cilantro and garlic.",
      "Taste and adjust the salt or lime as needed.",
      "Serve immediately with tortilla chips.",
    ],
  },
  {
    id: "cookies",
    title: "Chocolate Chip Cookies",
    emoji: "🍪",
    desc: "Chewy cookies loaded with chocolate.",
    time: "30 min",
    serves: "24",
    ingredients: [
      "2¼ cups all-purpose flour",
      "1 tsp baking soda",
      "1 tsp salt",
      "1 cup butter, softened",
      "¾ cup granulated sugar",
      "¾ cup brown sugar",
      "2 eggs",
      "1 tsp vanilla extract",
      "2 cups chocolate chips",
    ],
    steps: [
      "Preheat the oven to 375°F (190°C) and line baking sheets with parchment.",
      "Whisk together the flour, baking soda and salt in a bowl.",
      "Beat the butter with both sugars until creamy, then beat in the eggs and vanilla.",
      "Gradually mix in the dry ingredients, then stir in the chocolate chips.",
      "Drop rounded tablespoons of dough onto the baking sheets.",
      "Bake for 9–11 minutes until golden. Cool on the sheet for 2 minutes before transferring.",
    ],
  },
  {
    id: "salad",
    title: "Greek Salad",
    emoji: "🥗",
    desc: "Crisp, fresh and full of flavor.",
    time: "15 min",
    serves: "4",
    ingredients: [
      "3 tomatoes, chopped",
      "1 cucumber, sliced",
      "1 red onion, thinly sliced",
      "1 green bell pepper, sliced",
      "150g feta cheese, cubed",
      "Handful of Kalamata olives",
      "3 tbsp olive oil",
      "1 tbsp red wine vinegar",
      "1 tsp dried oregano",
    ],
    steps: [
      "Combine the tomatoes, cucumber, onion and bell pepper in a large bowl.",
      "Add the olives and gently toss.",
      "Whisk together the olive oil, red wine vinegar and oregano.",
      "Pour the dressing over the salad and toss to coat.",
      "Top with the feta cheese and serve.",
    ],
  },
  {
    id: "smoothie",
    title: "Berry Smoothie",
    emoji: "🍓",
    desc: "A quick, refreshing fruit smoothie.",
    time: "5 min",
    serves: "2",
    ingredients: [
      "1 cup mixed berries (fresh or frozen)",
      "1 banana",
      "1 cup yogurt",
      "½ cup milk or juice",
      "1 tbsp honey (optional)",
    ],
    steps: [
      "Add the berries, banana, yogurt and milk to a blender.",
      "Blend on high until completely smooth.",
      "Taste and add honey if you'd like it sweeter, then blend again.",
      "Pour into glasses and serve right away.",
    ],
  },
];

export default function Home() {
  const [recipe, setRecipe] = useState(null);

  if (recipe) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "linear-gradient(180deg, #2d1b14, #5c2c10)",
          fontFamily: "system-ui, sans-serif",
          color: "#fff",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <button
            onClick={() => setRecipe(null)}
            style={{
              padding: "8px 16px", borderRadius: 20, border: "none",
              background: "rgba(255,255,255,0.85)", color: "#5c2c10",
              fontWeight: 700, cursor: "pointer", fontSize: 14,
            }}
          >
            ← All recipes
          </button>

          <div style={{ textAlign: "center", marginTop: 16 }}>
            <div style={{ fontSize: 80 }}>{recipe.emoji}</div>
            <h1 style={{ fontSize: 38, margin: "8px 0" }}>{recipe.title}</h1>
            <p style={{ opacity: 0.8, margin: 0 }}>{recipe.desc}</p>
            <p style={{ opacity: 0.6, marginTop: 8, fontSize: 14 }}>
              ⏱ {recipe.time} &nbsp;•&nbsp; 🍽 Serves {recipe.serves}
            </p>
          </div>

          <section
            style={{
              background: "rgba(255,255,255,0.08)", borderRadius: 16,
              padding: 24, marginTop: 24,
            }}
          >
            <h2 style={{ marginTop: 0, fontSize: 24 }}>🧺 Ingredients</h2>
            <ul style={{ lineHeight: 1.8, paddingLeft: 22, margin: 0 }}>
              {recipe.ingredients.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <section
            style={{
              background: "rgba(255,255,255,0.08)", borderRadius: 16,
              padding: 24, marginTop: 20, marginBottom: 24,
            }}
          >
            <h2 style={{ marginTop: 0, fontSize: 24 }}>👩‍🍳 How to make it</h2>
            <ol style={{ lineHeight: 1.8, paddingLeft: 22, margin: 0 }}>
              {recipe.steps.map((step, i) => (
                <li key={i} style={{ marginBottom: 10 }}>{step}</li>
              ))}
            </ol>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", gap: 24,
        background: "linear-gradient(180deg, #2d1b14, #5c2c10)",
        fontFamily: "system-ui, sans-serif", padding: 24,
      }}
    >
      <h1 style={{ color: "#fff", fontSize: 42, margin: "16px 0 0" }}>🍳 Eva&apos;s Recipes</h1>
      <p style={{ color: "rgba(255,255,255,0.7)", margin: 0 }}>
        Pick a recipe to see how to make it!
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 20, width: "100%", maxWidth: 760,
        }}
      >
        {recipes.map((r) => (
          <button
            key={r.id}
            onClick={() => setRecipe(r)}
            style={{
              padding: 24, borderRadius: 16, border: "none",
              background: "rgba(255,255,255,0.1)", color: "#fff",
              cursor: "pointer", textAlign: "center",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ fontSize: 56 }}>{r.emoji}</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>{r.title}</div>
            <div style={{ fontSize: 14, opacity: 0.7, marginTop: 6 }}>{r.desc}</div>
            <div style={{ fontSize: 13, opacity: 0.55, marginTop: 10 }}>
              ⏱ {r.time} • 🍽 {r.serves}
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}
