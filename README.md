#### Individual Functional Prototype
### Interaction Instructions
## The original project relied solely on the SPACE key to toggle between Mode A and Mode B. I redesigned the interaction logic so that pressing SPACE now fully resets all related structures: arrays storing vertical and horizontal bands, cell-filling data, intersection colors, directional flags, and ongoing animation states. This prevents data contamination between modes and ensures each mode begins from a clean, predictable state.
## I additionally introduced an M-key audio control, allowing the user to play or pause background music. Because the visual animation now responds directly to audio, this interaction gives the user intentional control over the system’s rhythmic behavior. This approach aligns with Toshio Iwai’s philosophy on interactive sound–visual systems, which stresses that state boundaries and transitions must be clearly defined to avoid logical ambiguity during interaction.
### Individual Approach
## While the original group work was visually engaging, its animations were entirely deterministic or random, without any relation to sound or rhythm. My individual design shifts the conceptual focus toward audio-reactive generative behavior. I integrated FFT frequency analysis, allowing the system to extract bass and mid-range energy from the soundtrack. These values now drive multiple visual parameters: band thickness, vibration amount, cell brightness, and color-breathing intensity. Beat detection further adds rhythmic emphasis by generating bright flashes whenever bass energy exceeds an adaptive threshold.
## This approach is inspired by several sources. Ken Perlin’s seminal work (1985) demonstrates that Perlin noise produces smooth, continuous randomness, making it especially suitable for subtle jitter, organic shaking, and color transitions. Zhang et al. (2018) and Erdmann et al. (2025) describe how music information retrieval (MIR) techniques can be applied for real-time visual adjustments, validating my use of FFT and energy-based mappings. Similarly, Dixon (2000) outlines strategies for detecting beats through sudden changes in spectral energy, which directly informed the rhythmic flash effect in my prototype.
## The result is a system that no longer behaves as a static geometric generator, but instead breathes and pulses in synchrony with the music, creating a hybrid aesthetic between digital abstraction and audiovisual performance.
### Distinctiveness
## From geometric randomness to audio-reactivity
# The original work operates independently of sound, whereas my version makes the entire composition responsive to the soundtrack. Bass influences band thickness and flash intensity, mid-range frequencies drive cell color transitions, and beat detection introduces momentary bursts of brightness. This parallels synesthetic visualization approaches used in contemporary music graphics, such as those by Bagda (2020) and the rhythmic color-bursting systems found in audio-reactive stage visuals.
## Clean separation between modes
# In the group version, switching modes would often inherit the previous mode’s data, causing structural conflicts. My redesigned mode system clears all arrays and resets all states, ensuring that Mode A (bands) and Mode B (cells) function as independent subsystems. This not only eliminates visual glitches but also strengthens the conceptual identity of each mode.
## Stronger temporal rhythm
# The original timing system sometimes triggered overlapping actions, leading to inconsistent pacing. I resolved this by restructuring timers so that each band or cell is created through a complete and orderly cycle: start → animate → finalize → next. This produces a more deliberate rhythm and prevents multiple animations from interfering with one another.
### Technical Changes
## Complete audio system 
# I implemented p5.FFT to extract frequency energy, mapped bass/mid data to geometric properties, and incorporated adaptive beat detection to create rhythmic flashes. This transforms the static geometry into a dynamic visual-music system. The approach is consistent with MIR-driven visualization techniques discussed in audio-visual research (Zhang, 2018; Erdmann, 2025) and with Dixon’s (2000) model of energy-based beat analysis.
## Rebuilt mode-switching mechanism
# I redesigned mode switching so that all arrays and states are fully reset. This eliminates inherited geometric artifacts and ensures stable, predictable visuals. The approach echoes Iwai’s principle that interaction modes must not share uncontrolled internal states.
## Corrected timer conflicts
# I resolved the original issue where beginNext() and timerNext() overlapped by enforcing sequential execution. This prevents multiple bands or cells from being generated simultaneously and ensures the animation follows a smooth and logical progression. The change is consistent with the p5.js program-flow guidelines, which emphasize avoiding competing asynchronous updates inside the draw loop.
## Reorganized grid and cell-filling logic
# To maintain geometric consistency, I reset filledCells whenever modes switch or the system reaches the 19-element cycle threshold. I also limited mergeNear() to specific phases to avoid unintended line shifts. This restructuring aligns with McCormack’s (2022) findings on maintaining topological stability in noise-driven geometric systems.
### Inspiration Sources
## Broadway Boogie Woogie — Piet Mondrian
# Mondrian’s iconic painting inspired the structural rhythm, division patterns, and band-cell relationship used in my system.
## AUDIO（Bagda）
# This project demonstrates strong audio-reactive visuals designed for music festivals. Its use of: rhythmic color bursts；real-time beat responsiveness；geometric elements synchronized with music
# strongly aligns with my own audio-driven bands and cells system, especially the beat flash effect and thickness modulation.
## Toshio Iwai
# Iwai’s works explore interactive visual-sound systems using grids, tiles, and event-based triggers. This directly inspired my approach to:using grid divisions as the visual foundation；letting sound trigger structural changes；introducing playful interactive elements (such as the cat behavior)
### Conclusion
# My personal prototype significantly expanded the aesthetic and functional scope of the original project by integrating audio analysis, beat detection, Perlin noise movement, precise sorting, and clear pattern separation. The final outcome is a coherent audio-visual work that retains the geometric features of the team's original creation, while adding depth, musicality, and professionalism to the interactive experience.
### Reference
# Perlin, K. (1985). An Image Synthesizer. Proceedings of the 12th Annual Conference on Computer Graphics and Interactive Techniques (SIGGRAPH ’85), 19(3), 287-296. 
# Dixon, S. (2000, April 7). A Beat Tracking System for Audio Signals. Austrian Research Institute for Artificial Intelligence. 
# Popov, A. (2018). Using Perlin noise in sound synthesis. Linux Audio Conference. 
# Ellis, D. P.W. (2007). Beat Tracking by Dynamic Programming. Proceedings of the International Society for Music Information Retrieval (ISMIR).