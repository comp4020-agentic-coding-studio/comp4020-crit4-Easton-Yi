# Crit 4 reflection

**What was the breakthrough that moved the work forward?**

The breakthrough wasn't a feature, it was a test I almost didn't bother
writing. I'd already convinced myself multi-touch worked, just from reading
the code — every pointer and every key gets its own id-keyed voice, so of
course two fingers should sound independently. Simulating two simultaneous
touches anyway turned up a real bug: `setPointerCapture` could throw for a
pointer id the browser didn't consider "active," and that call sat before
the lines that actually made sound and light, so a capture failure silently
ate the whole gesture. Nothing in the code looked wrong until I watched it
fail. That's the habit I want to keep: confidence from reading is not the
same as confidence from watching it run, and the gap between them is exactly
where the interesting bugs hide.

**What did this work change about who I want to be as a developer?**

It sharpened how I read an AI-produced diff. Early on I was checking "does
this look reasonable," which caught nothing here — the code was reasonable,
it just had one ordering bug that only a live gesture could expose. Now I
default to asking what would make this fail, and actually forcing that
condition, rather than trusting that plausible code is correct code. I also
noticed I care more about unifying two things that *should* behave the same
— the keyboard and pointer pitch mapping — than about either one individually
looking clever. Consistency between input paths felt like the real
craftsmanship this week, not the firework on top of it.
