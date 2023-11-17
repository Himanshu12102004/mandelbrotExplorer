#version 300 es
precision highp float;

uniform vec2 viewportDimensions;
uniform float minI;
uniform float maxI;
uniform float minR;
uniform float maxR;
uniform vec3 userColors;
out vec4 vertexColor;
vec3 hsb2rgb( in vec3 col ){
    vec3 rgb = clamp(abs(mod(col.x*6.0+vec3(0.0,4.0,2.0),
                             6.0)-3.0)-1.0,
                     0.0,
                     1.0 );
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return col.z * mix(vec3(1.0), rgb, col.y);
}
void main()
{

vec2 c = vec2(
   ( gl_FragCoord.x * (maxR - minR) / viewportDimensions.x + minR),
    (gl_FragCoord.y * (maxI - minI) / viewportDimensions.y + minI)
);
int maxIterations=100+int(1.0/(maxI-minI));
if(maxIterations>1500){
  maxIterations=1500;
}
	vec2 z = c;
int i=0;
	for ( i = 0; i < maxIterations; i++) {
  
		float t = 2.0 * z.x * z.y + c.y;
		z.x = z.x * z.x - z.y * z.y + c.x;
		z.y = t;

		if (z.x * z.x + z.y * z.y > 30.0) {
			break;
		}

	}
    float stability= float(i) / float(maxIterations);
    float ur=sqrt(stability);
     vec3 hsbColor ;
// color=hsb2rgb(vec3(ur,1.0,1.0));
		// vertexColor = vec4(color.x,0,0, 1.0);

		vertexColor = vec4(ur*userColors.x,ur*userColors.y,ur*userColors.z, 1.0);
// if(stability==1.0)
		// vertexColor = vec4(color.x,0,0, 0.0);

}