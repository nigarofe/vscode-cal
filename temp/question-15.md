---
discipline: "C3"
description: "-"
source: ""
tags: ["ps17"]
---

# Question 15

## Proposition
$$\int \frac12\sin(t)e^{-\frac72 - \frac12\cos(t)}\,dt$$

## Step-by-step
- $u = -\frac72 - \frac12\cos(t)$  
- $\frac{du}{dt} = \frac12\sin(t)\;\Rightarrow\;dt = \frac{1}{\frac12\sin(t)}\,du$  
- $\displaystyle \int \frac{\frac12\sin(t)}{\frac12\sin(t)}e^{u}\,du = \int e^{u}\,du = e^{u} = e^{-\frac72 - \frac12\cos(t)} + C$

## Answer
$$
e^{-\frac72 - \frac12\cos(t)} + C
$$

