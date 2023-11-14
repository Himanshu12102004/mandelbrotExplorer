#version 300 es
precision highp float;

uniform vec2 viewportDimensions;
uniform float minI;
uniform float maxI;
uniform float minR;
uniform float maxR;
uniform int maxIterations;
out vec4 vertexColor;
vec3 hsb2rgb( in vec3 c ){
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                             6.0)-3.0)-1.0,
                     0.0,
                     1.0 );
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}
void main()
{
	// [0, 1080] -> [-2.0, 2.0] (1): Multiply by (2.0 - -2.0) / (1080 - 0)
	// [0, 4.0] -> [-2.0, 2.0]  (2): Subtracting 2.0 from result
	// [-2.0, 2.0]
	// 
vec2 c = vec2(
    gl_FragCoord.x * (maxR - minR) / viewportDimensions.x + minR,
    gl_FragCoord.y * (maxI - minI) / viewportDimensions.y + minI
);

	// Mandelbrot formula!
	vec2 z = c;
	//  maxIterations = 100;
int i=0;
	for ( i = 0; i < maxIterations; i++) {
		float t = 2.0 * z.x * z.y + c.y;
		z.x = z.x * z.x - z.y * z.y + c.x;
		z.y = t;

		if (z.x * z.x + z.y * z.y > 200.0) {
			break;
		}

	}
    float stability= float(i) / float(maxIterations);
    float ur=sqrt(stability);
    vec3 color = vec3(ur);
     vec3 hsbColor ;
// color=hsb2rgb(vec3(ur,1.0,1.0));
		vertexColor = vec4(color, 1.0);
// if(stability==1.0)
		// vertexColor = vec4(color, 0.0);

}