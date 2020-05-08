## Notes

Through a *lot* of trial and error, I was able to scan for the bulb, pair, and read and write to the different bluetooth characteristics.

Values are read/written as byte array buffers. Unsigned 16 bit integers are used.

## Services

Three services come up for the bulb, f000ffa0-0451-4000-b000-000000000000 contains the characteristics for manipulation.

## Characteristics

### f000ffa2-0451-4000-b000-000000000000
Observations: The last three values in the byte array reflect the RGB values

### f000ffa3-0451-4000-b000-000000000000
Writing to this attribute changes the bulb power state, and then overwrites the value.

WRITING
[83, 79] turns the bulb ON
[83, 67] turns the bulb OFF
eg. [83, ON/OFF]

READING
[79, 67] means the bulb is ON
[67, 67] means the bulb is OFF
eg.
[ON/OFF, 67]


Depending on the bulbs state, the byte array is [79, 67] for ON and [67, 67] for OFF.
Writing to this characteristic does not change the bulb's power state.

### f000ffa4-0451-4000-b000-000000000000
This characteristic's byte array has the RGB values for the bulb.
This is used for changing the bulb's color.

### f000ffa5-0451-4000-b000-000000000000
This characteristic reflects the previous one, with the RGB values.
Trying to set the values through this characteristic also works.
Note that the bulb actually writes to this value via the app.

### f000ffa6-0451-4000-b000-000000000000
Constantly changing independently from any user interactions
Could be a timer/counter?
