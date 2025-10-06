# Quadratic Equations

## Introduction

> id: intro
> section: introduction
> color: "#F6700F"
> level: Intermediate

    img.text-wrap(src="images/skater-1.jpg" style="shape-outside: url(images/skater-1-mask.png)" width=400 height=650)

Welcome to GlideTech, a small startup specializing in producing electric scooters. After months of research and design, the engineering team has finally completed a new model, the _EcoRide_, and production is ready to begin. You’ve been assigned to determine the best resale price for this new scooter model. However, manufacturing them doesn’t come cheap:

* The tools and machines required to construct scooters cost \$5,000. This is
  often called a __fixed cost__.
* Every scooter costs additional \$30 worth of of wood, other materials,
  and salary for the employees. This is often called a __variable cost__.

In other words, the __cost__ of producing _n_ scooters is

{.text-center.no-voice} [cost](pill:orange) = _{x-equation(solution="5000+30×n")}_.

---
> id: demand

The new scooters are highly anticipated, but if the price is too high, fewer
people will actually buy one. We can show this on a chart with the price of a
scooter along the _x_-axis, and the corresponding number of people who want
buy one (the __demand__) on the _y_-axis.

Which of these charts makes most sense for the relationship between price and
demand?

    x-picker.wrap
      .item(data-error="wrong-chart-1" style="width: 220px")
        x-coordinate-system(width=220 height=180 x-axis="0,10,2" y-axis="0,10,2" axis-names="price,demand" crosshairs="no" labels="no" fn="0.6x + 2")
      .item(style="width: 220px")
        x-coordinate-system(width=220 height=180 x-axis="0,10,2" y-axis="0,10,2" axis-names="price,demand" crosshairs="no" labels="no" fn="8 - 0.6x")
      .item(data-error="wrong-chart-2" style="width: 220px")
        x-coordinate-system(width=220 height=180 x-axis="0,10,2" y-axis="0,10,2" axis-names="price,demand" crosshairs="no" labels="no" fn="2.5 * sqrt(x)")

---
> id: demand-1

A higher price means that fewer people want to buy a scooters, so the graph
of the function has to move downwards. After doing some market research,
economists came up with the following equation:

{.text-center} [demand](pill:teal) = 2800 – 15 × [price](pill:purple)

For example, if a scooter costs \$80, the demand will be [[1600]] units.

---
> id: intro4

    //- img.text-wrap.s-hide(src="images/skater-3.jpg" style="shape-outside: url(images/skater-3-mask.png)" width=280 height=480)

The __revenue__ of our company is the total income we make. It is the number of
scooters sold (the _demand_) times the price of each:

{.text-center} [revenue](pill:green) = [demand](pill:teal) × [price](pill:purple)

But the number we are more interested in is our __profit__: the revenue we make
from selling scooters, minus the cost of producing them. Can you find an
equation that expresses our [profit](pill:yellow) in terms of just the
[price](pill:purple) of every scooter?

    x-equation-system(steps="demand*price-(5000 + 30*demand) | (2800-15*price)*price-5000-30*(2800-15*price)" hints="intro-1|intro-2|intro-3")
      table
        tr
          td: em.pill.yellow profit
          td= '='
          td #[em.pill.green revenue] − #[em.pill.orange cost]
        tr
          td
          td= '='
          td: x-equation(solution="-15 × price^2 + 3250 × price - 89000" substitutions="cost: 89000 - 450 price | demand: 2800 - 15 price | revenue: 2800 price - 15 price^2")

---
> id: intro-table

Notice that this equation contains [price](pill:purple) as well as [`price^2`](pill:purple). It is
called a [__Quadratic Equation__](gloss:quadratic-equation), named after the Latin word “quadratus”
for square.

To work out how to maximise our profit, let’s calculate the profit for a few
different prices:

::: .overflow-wrap.overflow-table

| [price/$](pill:purple)  | 20   | 40   | 60  | 80  | 100 | 120 | 140 | 160 | 180 |
| [profit/$](pill:yellow) | –30k | 17k | [[52]]k | [[75]]k | [[86]]k | [[85]]k | _{span.reveal(when="blank-3")}72k_ | _{span.reveal(when="blank-3" delay=400)}47k_ | _{span.reveal(when="blank-3" delay=800)}10k_ |
{.grid}

:::

---
> id: intro-chart

Now we can plot all these points in a coordinate system, and connect them with
a line:

    x-coordinate-system(width=640 height=400 x-axis="-20,200,20" y-axis="-100000,100000,20000" axis-names="price/$,profit/$" padding=10 animate)
      .region.r1(style="top: 48%; height: 46%; left: 6%; width: 6%;")
      .region.r2(style="top: 26%; height: 40%; left: 79%; width: 21%;")

You’ll remember that the graph of a [linear function](gloss:linear-function) is
always a straight line. But as you saw above, the graph of a [quadratic
function](gloss:quadratic-function) is curved. It even has a specific name: a
[__Parabola__](gloss:parabola).

If the [price is 0](->.r1), our profit is negative, because we’re just
giving away expensive scooters for free. As the price increases, our
profits rise, too. However, if the scooters become [too expensive](->.r2),
people no longer want to buy them and our profit falls again.

We can maximise our profit by pricing the scooters at approximately
\$[[108 ± 10]].

---
> id: intro-final

    figure: x-img(src="images/skater-2.jpg" alt="Skateboarder" width=400 height=500)

In the real world, it can be very difficult for companies to determine a precise
equation for their profit – and it is likely to be much more complicated than
this example.

Still, quadratic equations appear everywhere in nature, engineering and
economics. In this course you will learn different methods for solving
quadratic equations and to understand their graphs.



-----------------------------------------------------------------------

## Solving Quadratic Equations

> id: definitions
> section: solving


You already know how to solve [_linear equations_](gloss:linear-equation):
equations of the form `ax + b`, where _x_ is a [variable](gloss:variable), and
_a_ and _b_ are some specific numbers.

Now let’s think about a more complex class of equations which also contain
`x^2`. A [__quadratic equation__](gloss:quadratic-equation) is an equation of
the form

{.text-center} `ax^2 + bx + c = 0`,

where _x_ is a variable and _a_, _b_, and _c_ are some specific numbers (called
_coefficients_). Both `b` and `c` could be 0, but `a` can’t be 0 because then
we would just have [[a linear equation|zero|no solution]].

---
> id: parabola

Like you saw in the [introduction](/course/quadratics/introduction), plotting the graph of a
quadratic function in a coordinate system gives a curved shape called a __Parabola__:

    x-coordinate-system(x-axis="-5,5,1" y-axis="-3,5,1")

{.text-center} `y =`${a}{a|1|-5,5,0.1} `x^2+`${b}{b|0|-5,5,0.1} `x+`${c}{c|0|-5,5,0.1}

Try changing the values of _a_, _b_ and _c_, and see how the parabola changes.

{.reveal(when="var-0 var-1 var-2")} To solve a quadratic equation, we have to find the points where
`y = 0`. These are the points where the graph of the parabola [[crosses the x-axis|crosses the
y-axis|turns around]].

{.reveal(when="blank-0")} While linear equations always have exactly one solution, we can see from
the diagram that quadratic equations can sometimes have and [no solution](action:set(1,-2,2)),
[one solution](action:set(1,2,1)), or even [two solutions](action:set(1,-4,2)).

In the following sections we will discover why that is the case, learn several different methods to
find all solutions of a quadratic equation.

---

### Level 0: Taking Square Roots

When trying to solve equations, we often use _opposites_ of mathematical
operators. For example, addition and subtraction are opposites, and
multiplication and [[division|addition|square roots]] are opposites. The opposite
of squaring a number is taking the square root. For example, `5^2 = 25`, so `sqrt(25) = 5`.

This can help us to solve some simple quadratic equations:

{.text-center} `x^2 - 25 = 0`

First, we isolate `x^2` on one side of the equation:

{.text-center} `x^2 = 25`

Now we take square roots of both sides, remembering to add a ±:

{.text-center}
`x = +- sqrt(25)`
`x = +- 5`

Sometimes we have to do a bit more work to isolate `x^2`:

* For every value of `x^2`, there are [[two|three|one]] possible values of `x`:
  a positive and a negative one. For example, if `x^2=`${x*x}{x|4|2,10,1}, we
  don't know if `x=`${x} or `x=`${'–'+x}. In this case, the quadratic equation
  has two solutions.

* {.reveal(when="blank-0")} Square numbers are always positive. This means that
  there [[is no number|are multiple numbers]] `x` that could satisfy `x^2 = -9`.
  This equation has __no solutions__.

{.eqn-system}
| `3` | `x^2` | `-11` | `=` | `7`           | {.eqn-comment} add 11 to both sides |
| `3` | `x^2` |       | `=` | `18`          | {.eqn-comment} divide both sides by 3 |
|     | `x^2` |       | `=` | `6`           | {.eqn-comment} take square roots of both sides |
|     | `x`   |       | `=` | `+-sqrt(6)` |
|     |       |       | `=` | `+-2.45`     |


As an abbreviation, we sometimes write `x = +-`${x} (“_x_ equals plus-minus ${x}”).

EXAMPLE 11: Solve `x^2=100`.
Answer: Easy. `x=10` or `x=−10`.

The only possible difficulty here is that students often forget that in algebra
most numbers have two square roots.

EXAMPLE 12: Solve `w^2=36`.
Answer: Easy. `w=6` or `w=−6`.

EXAMPLE 13: Solve `x^2=17`.
Answer: Okay, not as pretty but just as easy: `x=sqrt(17)` or `x=−sqrt(17)`.

EXAMPLE 14: Solve `x^2=0`.
Answer: Zero is the only number with just one square root: x=0 is it.

PRACTICE 15: Solve:
a) x^2=121.
b) p^2=40.
c) y^2+5=14.
d) 2x^2=50.
e) x^2=−6.

---

### Level 1:

EXAMPLE 17: Solve `(x+3)^2=100`.

Answer: A tad more complicated but still easy. This problem is saying:
“Something squared is 100.” So the something must be 10 or −10. That is:

`x+3=10`   or   `x+3=−10`
yielding:
`x=7`    or   `x=−13`.

---

::: tab

#### Example

__Solve `(y−4)^2=25`__

Answer: We have:
y−4=5    or    y−4=−5
yielding:
y=9    or   y=−1.

WARNING!!   Many students like to answer questions like these using the ±
symbol. But there is a potential danger. Some will then write the following:

`(y−4)^2=25`
`y−4=±5`
`y=±9`

::: tab

#### Example 2

__Solve 4(p+2)2−16=0__

Answer: Add 16:

4(p+2)2=16.

Divide though by 4:

(p+2)2=4.

So

p+2=2   or   p+2=−2
yielding:
p=0    or    p=−4.

::: tab

#### Example 3

__Solve (x+7)2+9=0__

Answer: We have (x+7)2=−9. In the system of real numbers, it is impossible
for a quantity squared to be negative. This equation has no solution.

::: tab

#### Example 4

__Solve (x−1)2=5__

Answer: We have:

x−1=√5    or    x−1=−√5
So
x=1+√5    or   x=1−√5.

::: tab

#### Example 5

__Solve (x+3)2=49__

Answer: We have:

x+3=7    or    x+3=−7
yielding:
x=4    or    x=−10.

:::

---

PRACTICE 23: Solve:

a) (x−1)^2=64
b) (p−3)^2=16
c) (y+1)^2−2=23
d) 3(x−900)^2=300
e) (x−√2)^2=5

PRACTICE 24:

a) How many solutions does (x+7)^2=0 possess? What are they?
b) How many solutions does (x+7)^2=−2 have? What are they?

---

### Level 2:

EXAMPLE 25: Solve `x^2 + 6x + 9 = 49`.

Answer: If one is extremely clever one might realize that this is a repeat of
example 22:

The quantity `x2+6x+9=49` happens to equal `(x+3)^2`.

To check this, let’s work out `(x+3)×(x+3)` as the area of a square divided
into four pieces:

|     | `x`   | 3    |
| `x` | `x^2` | `3x` |
| 3   | `3x`  | 9    |
{.q-grid}

Yes, we see that (x+3)2 does equal x2+6x+9.  So the question:
Solve x2+6x+9=49 is indeed really the question:
Solve (x+3)2=49 in disguise.

We have:
x+3=7    or    x+3=−7
x=4    or    x=−10.

So the challenge in level 2 is to recognize more complicated expressions as
easy level 1 problems in disguise.

---

Here are some more examples

::: tab

#### Example 2

__Solve `x2+4x+4=25`.__

Answer: Let’s draw the square for `x^2+4x+4`.

There is an `x2` piece that must come from `x×x`.

Because we want the figure to be a perfectly symmetrical square (squares are
good for level 1) the “4x ” must come from two symmetrical pieces: 2x and 2x.

This means we must have the numbers 2 and 2 on the sides of the square, and
this is consistent with the final portion being 4.

|     | `x`   | 2    |
| `x` | `x^2` | `2x` |
| 2   | `2x`  | 4    |
{.q-grid}

Thus we see that `x^2+4x+4` is really `(x+2)^2` in disguise, and we need to solve:

`(x+2)^2=25`.

This is easy:

x+2=5    or    x+2=−5
x=3    or    x=−7.

::: tab

#### Example 2

__Solve x2−10x+25=169.__

Answer: Let’s draw the square for x2−10x+25.

There is an x2 piece that must come from x×x . And we need two (symmetrical) pieces that add to =10x.

This means the need the numbers −5 and −5, which is consistent with the final portion of the square being 25.

|     | `x`   | -5    |
| `x` | `x^2` | `-5x` |
| -5  | `-5x` | 25    |
{.q-grid}

`x^2−10x+25=169`
`(x−5)2=169`
`x−5=13`    or    `x−5=−13`
`x=18`   or   `x=−8`

::: tab

#### Example 3

__Solve x2−20x+100=7.__

Answer: We have:

|     | `x`    | -10    |
| `x` | `x^2`  | `-10x` |
| -10 | `-10x` | 100    |
{.q-grid}

x2−20x+100=7
(x−10)2=7
x−10=7–√    or   x−10=−7–√
x=7–√+10    or   x=−7–√+10  □

::: tab

#### Example 4

__Solve x2+25–√x+5=4.__

Answer: Don’t be perturbed by the numbers. Just follow things through as before.

Do you see we have this square?

|           | `x`        | `sqrt(5)`  |
| `x`       | `x^2`      | `sqrt(5)x` |
| `sqrt(5)` | `sqrt(5)x` | 5          |
{.q-grid}

x2+25–√x+5=4
(x+5–√)2=4
x+5–√=2    or    x+5–√=−2
x=2−5–√    or    x=−2−5–√  □

:::

---

PRACTICE 30: Solve:

a) x2+40x+400=100
b) p2−6p+9=9
c) x2−4x+4=1
d) 3x2−18x+27=12
e) x2−22–√x+2=19

PRACTICE 31: Solve x2+2Bx+B2=D2  in terms of B and D.

---

### Level 3

EXAMPLE 32: Solve x2+8x+15=80.

Answer: Let’s apply the technique of level 2 and draw the box.

The x2 piece must come from x×x. And because we want the symmetry of a square,
8x must come for two pieces 4x each:

|     | `x`   | `4`  |
| `x` | `x^2` | `4x` |
| `4` | `4x`  | 16   |
{.q-grid}

This means we must have the numbers 4 and 4 on the sides of the square, giving
us 16 for the remaining piece of the squares, WHICH IS INCONSISTENT WITH THE
NUMBER 15 in the problem.

It seems the box method is not of help. We have two options:

1. Give up and cry.
2. Be an adult and make it work!

Let’s follow option 2 making use of a good piece of general advice:
If there is something in life you don’t like and are not happy with, change it!

In this problem we would like the number 15 in x2+8x+15 to actually be a 16. So
let’s add one and make it 16!

Of course, to keep the equation balanced, if we add 1 to one side of an equation
we need to add 1 to the other side as well:

x2+8x+15+1=80+1.

That is, we have:

x2+8x+16=81.

And the box tells us that this is:

(x+4)2=81
and all now falls into place:

x+4=9    or    x+4=−9
x=5     or    x=−13

---

Here are a few more examples:

::: tab

#### Example 1

__Solve x2−6x+11=27.__

The box tells us that the x2 and the −6x pieces want the number 9 to
accompanying them, not 11:

|     | `x`   | `-3`  |
| `x` | `x^2` | `-3x` |
| `-3` | `-3x`  | 9   |
{.q-grid}

Let’s make that happen. Subtract 2 from both sides:

x2−6x+9=25
(x−3)2=25
x−3=5    or    x−3=−5
x=8    or    x=−2  □

::: tab

#### Example 2

__Solve x2−10x+3=0.__

Answer: The box tells us that the x2 and the −10x pieces want the number 25 to
accompanying them, not 3:

|      | `x`   | `-5`  |
| `x`  | `x^2` | `-5x` |
| `-5` | `-5x` | 25    |
{.q-grid}

So let’s add 22 to both sides to make that happen!

x2−10x+3=0
x2−10x+25=22
(x−5)2=22
x−5=2–√2    or    x−5=−2–√2
x=5+2–√2    or    x=5−2–√2

::: tab

#### Example 3

__Solve x2−6x=55.__

Answer: To obtain a perfect square add 9 to both sides.

|     | `x`   | `-3`  |
| `x` | `x^2` | `-3x` |
| `-3` | `-3x`  | 9   |
{.q-grid}

x2−6x+9=64
(x−3)2=64
x−3=8    or    x−3=−8
x=11    or    x=−5

::: tab

#### Example 4

__Solve w2+90=22w−31.__

Answer: Let’s bring all the terms containing a variable to the left side:

w2−22w+90=−31.

|     | `x`   | `-11`  |
| `x` | `x^2` | `-11x` |
| `-11` | `-11x`  | 121   |
{.q-grid}

The box tells us to add 31 to each side:

w2−22w+121=0
(w−11)2=0
w−11=0
w=11   □

:::

---

Now it's your turn! Try to solve these practice problems:

::: .box
#### Problems

Solve these equations:

a) x2+12x−5=40
b) z2+2z+3=11
c) x2−40x+300=69
d) 2f2−16f+30=48
e) x2+100x+2=3

Solve x2+3x+1=5. Don’t be afraid of fractions. You can handle them!

:::

---

### Level 4

EXAMPLE 39: Solve x2+3x+1=5.

Answer: Solving this problem does indeed require the use of fractions:

|       | `x`    | `3/2`  |
| `x`   | `x^2`  | `3/2x` |
| `3/2` | `3/2x` | `9/4`  |
{.q-grid}

Adding `9/4` to both sides gives:

x2+3x+94=5+114
(x+32)2=614
(x+32)2=254
x+32=52    or    x+32=–52
x=1    or    x=−4
However, most people would prefer to not work with fractions.

The problem here is that the middle term, the 3x, has an odd number for a
coefficient. So … If we don’t like that, let’s change it!

Perhaps the easiest way to create an even number in the middle is to multiply
everything through by 2, so x2+3x+1=5 becomes:

2x2+6x+2=10.

COMMENT: Some students might say it would be simpler to add x to both sides to
then obtain x2+4x+1=5+x. But then we have x’s on both sides of the equation,
which is annoying.

Okay … Let’s try the box method on 2x2+6x+2=10.

|      | `x`    |  |
| `2x` | `2x^2` |  |
|      |        |  |
{.q-grid}


But we have a problem now with the very first piece of the equation: We need
two symmetrical terms that multiply together to make 2x2. Most students would
suggest 2x and x, but this right away ruins the square method we’ve been
following in levels 1, 2, and 3.

ALTERNATIVE IDEA: Instead of multiplying through by 2, multiply through by 4.

This again makes the middle term even AND solves the problem with the first
term. Let’s see why:

Start with: x2+3x+1=5.

Multiply through by 4:

4x2+12x+4=20.

Now apply the box method:

|      | `2x`   | `3`  |
| `2x` | `4x^2` | `6x` |
| `3`  | `6x`   | `9`  |
{.q-grid}

We see that 4x2 comes from 2x multiplied with 2x, preserving the symmetry.

Notice that the middle term 12x splits into two equal pieces, 6x plus 6x, as
planned, which means we need the numbers 3 and 3 on the sides ( 2x times THREE
gives 6x).

We also see that the number we need from the box is 9. Adding 5 to both sides
of the equation 4x2+12+9=20 yields:

4x2+12x+9=25.

The box shows that  4x2+12x+9 is really (2x+3)2, so we have a level 1 problem:

(2x+3)2=25
2x+3=5    or    2x+3=−5
2x=2    or    2x=−8
x=1    or    x=−4  □

IF THE MIDDLE TERM IS ODD, MULTIPLYING THROUGH BY 4 IS A CLEVER IDEA!

---

::: tab

#### Example 4

__Solve x2−5x+6=2.__

Answer: Let’s multiply through by 4:

4x2−20x+24=8

|      | `2x`   | `-5`   |
| `2x` | `4x^2` | `-10x` |
| `-5` | `-10x` | `25`   |
{.q-grid}

Adding 1 to both sides gives:

4x2−20x+25=9
(2x−5)2=9
2x−5=3    or    2x−5=−3
2x=8    or    2x=2
x=4    or    x=1  □

::: tab

#### Example 4

__Solve x2+x=34.__

Answer: Let’s multiply through by 4:

4x2+4x=3

|      | `2x`   | `1`  |
| `2x` | `4x^2` | `2x` |
| `1`  | `2x`   | `1`  |
{.q-grid}

Adding 1 to both sides gives:

4x2+4x+1=4
(2x+1)2=4
2x+1=2    or    2x+1=−2
2x=1    or    2x=−3
x=12  or  x=−32  □

::: tab

#### Example 4

__Solve p2+7p−2=5__

Answer: Let’s multiply through by 4:

4p2+28p−8=20

|      | `2p`   | `7`   |
| `2p` | `4p^2` | `14x` |
| `7`  | `15x`  | `49`  |
{.q-grid}

Adding 57 to both sides gives:

4p2+28p+49=77
(2p+7)2=77
2p+7=7–√7    or    2p+7=−7–√7
2p=7–√7–7    or    2p=−7–√7–7
p=7√7–72    or    p=−7√7–72  □

:::

---

PRACTICE 43: Solve:

a) x2+11x−5=7
b) z2−3z+1=−1
c) x2−x−1=234
d) x2+5x+12=70
e) x2+3=9

---

### Level 5 Quadratics

EXAMPLE 45: Solve 3x2+5x+1=9.

Answer: This is the first example we’ve encountered with a first term more
complicated than just x2. We could divided throughout by 3 and solve instead
the equation x2+13x+13=3 and use the box method – and it will work (try it?) –
but we will be thick in the midst of fractions.

We have in the previous level multiplied through by 4 and have successfully
dealt with 4x2 as 2x×2x. This works because 4 is a perfect square.

So in this problem, let’s try making 3x2 into a perfect square by multiplying
through by 3.

9x2+15x+3=27.

The first term is 3x×3x but the middle term is 15x, which has an odd
coefficient. To avoid fractions, let’s also multiply through by 4.

36x2+60x+12=108.

This has kept the first term a perfect square – we have 36x2=6x×6x – and has
made the second term even. It seems we are set to go!

|      | `6x`    | `5`   |
| `6x` | `36x^2` | `30x` |
| `5`  | `30x`   | `25`  |
{.q-grid}

The box shows we would like the number 25 to appear. Let’s add 13 to both sides:

36x2+60x+25=121
6x+5)2=121
6x+5=11    or    6x+5=−11
6x=6    or    6x=−16
x=1    or    x=−83
Success!     □

---

The previous example illustrates …

THE ULTIMATE BOX METHOD
To solve an equation of the form:

ax2+bx+c=d
i) MULTIPLY THROUGH BY a (to make the first term a perfect square)
ii) MULTIPLY THROUGH BY 4 (to avoid fractions)
iii) DRAW THE BOX

and off you go!

THE BOX METHOD WILL NEVER LET YOU DOWN!

---

::: tab

#### Example 1

__Solve 7x2−x+1=9.__

Answer: Let’s multiply through by 7 to make the leading term a square:

49x2−7x+7=63
and through by 4 to make the second term even (and to preserve the square):

196x2−28x+28=252

|      | `14x`    | `-1`   |
| `14x` | `169x^2` | `-14x` |
| `-1`  | `-14x`   | `1`  |
{.q-grid}

Subtract 27 from each side and we’re good to go!

196x2−28x+1=225
(14x−1)2=225
14x−1=15    or    14x−1=−15
14x=16    or    14x=−14
x=87    or    x=−1   □

::: tab

#### Example 2

__Solve  2x2+3x−3=5.__

Answer: Let’s multiply through by 2 to make the first term a perfect square:

4x2+6x−6=10.

Let’s multiply through by 4 and we’ll see the fractions are cleared away:

16x2+24x−24=40.

|      | `4x`    | `3`   |
| `4x` | `16x^2` | `12x` |
| `3`  | `12x`   | `9`  |
{.q-grid}

Let’s add 33 to each side:

16x2+24x+9=73
(4x+3)2=73
4x+3=73−−√    or    4x+3=−73−−√
4x=−3+73−−√    or    4x=−3−73−−√
x=−3+73√4    or    x=−3−73√4
The numbers weren’t pretty, but the method is straightforward.    □

::: tab

#### Example 2

__Solve −2x2+3x+7=1.__

Answer: Let’s multiply through by −2 and then by 4. That is, let’s multiply through by −8.

16x2−24x−56=−8

|      | `4x`    | `-3`   |
| `4x` | `16x^2` | `-12x` |
| `-3`  | `-12x`   | `9`  |
{.q-grid}


16x2−24x+9=−8+9+56
(4x−3)2=57
4x−3=±5–√7
x=3±5√74
Done!    □   (QUESTION: Was it dangerous to use the ± symbol here?)

::: tab

#### Example 2

__Solve 11x2−x+5=0__

Answer: Let’s multiply through by 11and by 4, that is, through by 44:

484x2−44x+220=0.

|      | `22x`    | `-1`   |
| `22x` | `484x^2` | `-22x` |
| `-1`  | `-22x`   | `1`  |
{.q-grid}

Subtracting 219 from both sides gives:

484x2−44x+1=−219
(22x−1)2=−219
But there is no number whose square is negative!

The box method is telling us there is no solution to this equation! □

:::

---

COMMENT: Every example thus far has been crafted to have a solution, but this
need not always be the case. For example:

x2=9 has exactly two solutions.

x2=0 has exactly one solution.

x2=−9 has no solutions.

The box method turns every quadratic into an equation of the form:

(something)2=A.

If A is positive, there will be two solutions; if A is zero, there will be one solution; and if A is negative, there will be no solutions.

---

### Problems

PRACTICE 50: Solve:

a) 3x2+7x+5=1
b) 5x2−x−18=0
c) 3x2+x−2=2
d) 2x2−3x=5
e) 10x2−10x=1
f) 2x2−3x+2=0
g) 2x2=9
h)   4−3x2=2−x


a) A rectangle is twice as long as it is wide. Its area is 30 square inches.
What are the length and width of the rectangle?

b) A rectangle is four inches longer than it is wide. Its area is 30 square
inches. What are the length and width of the rectangle?

c) A rectangle is five inches longer than its width. Its area is 40 square
inches. What are the dimensions of the rectangle?


PRACTICE 54: Solve the following quadratic equations:

a) v2−2v+3=27
b) z2+4z=7
c) w2−6w+5=0
d) α2−α+1=74
Also note that x=(x−−√)2. Solve the following disguised quadratics.

e) x−6x−−√+8=0
f) x−2x−−√=−1
g) x+2x−−√−5=10
WATCH OUT! Explain why only one answer is valid for g).

h) 3β–2β−−√=7
i) 2u4+8u2−5=0


PRACTICE 55:

a) Show that 2(x−4)2+6 is quadratic.

b) Solve 2(x−4)2+6=10.

c) Consider y=2(x−4)2+6. What x-value gives the smallest possible value for y?

1. Question
What is the best way to solve (2x+3)2=19 ?

Solve (x+1)3=27.

Solve −3x2+5x+2=1 via the box method.

What is the perimeter of a rectangle of area 25 square inches with one side 2
inches longer than then other?

Solving (x−a)(x−b)=0 obviously gives x=a  orx=b. But if we expand the equation
it reads: x2−(a+b)x+ab=0. Apply the box method to x2−(a+b)x+ab=0. Does it also
give x=a or x=b?

---

### Factorising

Let's have a look at a slightly more complex quadratic equation

{.text-center} `x^2 - 4x = 0`

This equation contains an x-term (target) as well as an x^2 term,
which means that our previous method of isolating x^2 on one side
and then taking square roots will no longer work.

But there is a different trick to help us - we can factorise one "x"
out of both `x^2` and `4x`:

{.text-center} `x (x - 4) = 0`

Now we can use a useful property of multiplication: if the product of
two terms is 0, then one of the two terms must also be zero. There is
no way you can get 0 by multiplying two numbers which are _both not 0_.


In our example, this means that either `x = 0`, or `(x-4) = 0`. Therefore
the quadratic equation has two solutions: `x=0` and `x=`[[4]].


Here is another quadratic equation that can be solved using factoring:

{.text-center} `x^2 - 6x + 5 = 0`

Unlike before, we cannot just factor out _x_, because we'd still have the
5 at the end left over. Our solution needs to be a bit more clever:

{.text-center} `(x - 3)(x - 2) = 0`

If you expand those brackets, you will find that it is exactly the same.
But now we can use the same trick for a product that is 0, to find that
the quadratic equation has two solutions: `x=`[[3]] or `x=`[[2]].

Unfortunately, this doesn't explain how we found two numbers 2 and 3 that
just _happened_ to work in the equation above. To work that out, we can
work backwards:

{.eqn-system}
| `(x - P)(x - Q)` | `= 0` |
| `x^2 - Qx - Px + P*Q` | `= 0` |
| `x^2 - (P+Q)x + P*Q` | `= 0` |


Now, if we have a quadratic equation like `x^2-8x+15=0`, we can just compare
the coefficient to see that we want P+Q=8 and P*Q=15. After a little bit of
guesswork and trying different possibilities, we might find that one possible
solution is P=3 and Q=5. Therefore,

{.eqn-system}
| `x^2-8x+15` | `= 0` |
| `(x-3)(x-5)` | `= 0` |
| `x-3=0` or `x-5` | `= 0` |
| `x=3` or `x` | `= 5` |

Finding the numbers P and Q always takes a little bit of guesswork, but in
all the examples below it should be relatively straightforward.


Try to find the missing number in these factorisation examples:

{.text-center}
x^2 + 3x + 2 = (x+1)(x+[[1]])
x^2 + 5x + 4 = (x+4)(x+[[1]])
x^2 - 8x + 15 = (x-3)(x-[[1]])
x^2 - 5x - 14 = (x+2)(x-[[1]])



--------------------------------------------------------------------------------



## The Quadratic Formula

> section: formula


    // https://betterexplained.com/articles/quadratic-formula/

Completing the square can be tricky, and it is easy to make mistakes along the
way.

Let's follow the steps when completing the square, but use _a_, _b_ and _c_
as coefficients for the quadratic equation, rather than actual numbers:

Completing the square is long and complicated, and it is easy to make mistakes.
Luckily, there is a shortcut that makes it a lot simpler!

To find it, we need to repeat the process of completing the square, but leaving
the coefficients as _a_, _b_ and _c_ rather than actual numbers.

Lets start with a quadratic equation of the form

{.text-center} `ax^2 + bx + c = 0`.

To make the first term a perfect square, we have to multiply the entire equation
by `a`. To avoid fractions, we also multiply by 4. This gives;

{.text-center} `4a2x2+4abx+4ac=0`.

Now apply the box method:

|       | `2ax`     | _b_    |
| `2ax` | `4a^2x^2` | `2abx` |
| `b`   | `2abx`    | `b^2`  |
{.q-grid}

These steps were ugly, painful, and you don't need to remember them (even
though it was just the same as completing the square, just with variables).
The result, however, was worth it: a single equation that tells us the
solutions of _any_ quadratic equation. It is often called the __Quadratic Formula__:

{.text-center#qformula} `x = (-b +- sqrt(b^2 - 4ac))/(2a)`

To solve a quadratic equation, we just have to replace _a_, _b_ and _c_ with
the actual numbers in our case, and then simplify the fraction.

Some curricula feel it is important to notice that the formula
x=−b±b2−4ac√2a represents two symmetrical values about the middle point x=−b2a.

From part 4 of this course we know that the vertex of the parabola lies halfway
between any two symmetric points. Our technique of simply looking for interesting
x-values makes the location of the vertex clear. One need not know this formula.

(But if you do want it … just write y=ax2+bx+c as y=x(ax+b)+c. This shows that
inputs x=0 and x=−ba give symmetrical outputs. The vertex is thus halfway
between these values … at x=−b2a!)

---

### The Discriminant

One particularly important part of the quadratic equation is the [term under
the square root](->#qformula_msqrt), which is called the __discriminant__.
Depending on the value of `b^2-4ac`, you can tell a lot about the solutions of
a quadratic equation, without ever actually soling it:

* If `b^2-4ac<0`, the quadratic equation has _no solutions_, because we cannot
  take square roots of negative numbers. (More on that later…)
* If `b^2-4ac=0`, the quadratic equation has _one solution_. Zero is the only
  number with just one square root, because `+sqrt(0) = -sqrt(0)`.
* If `b^2-4ac>0`, the quadratic equation has _two solutions_ like before, one
  when evaluating the quadratic formula with +, and one when evaluating it
  with –.

The two solutions lie at symmetrical positions about the value `x=−b/(2a)`.

---

### Solving Quadratic Equations – Summary

We now saw multiple different ways to solve quadratic equations, all of which
have advantages and disadvantages:

* __Basic Algebra__
  This is the easiest way, but it only works for quadratic equations that don't
  contain an _x_-term.

* __Factoring__
  Also quite simply, but it takes some guesswork and it doesn't always work.

* __Completing the Square__
  Very long and complicated. It is easy to make mistakes. In addition to finding
  the solutions of an equation, it also tells us the vertex of the corresponding
  parabola.

* __Quadratic Formula__
  Straightforward formula that always work, but it sometimes feels like "magic"
  and it is easy to forget why and how it works.
