from matplotlib import pyplot as plt
import numpy as np
from PIL import Image


def crop_and_resample(gif, i):
    gif.seek(i)

    # get the frame as numpy array
    frame = gif.convert("RGBA")
    frame = np.array(frame)

    # remove top 90, bottom 90, left 110, right 100 pixels
    frame = frame[105:-90, 110:-100]

    # get the dimensions of the frame
    height, width, channels = frame.shape

    # resample the frame to 60x70
    frame = Image.fromarray(frame)
    frame = frame.resize((40, 50), Image.LANCZOS)
    frame = np.array(frame)

    return frame


def write_draw_right_mario(frame, frame_number):
    height, width, channels = frame.shape
    print(f".macro draw_right_mario_frame_{frame_number}(%ref_x, %ref_y)")
    # iterate over each pixel in the image, compute hex value of color (ignoring opacity) and print
    for y in range(height):
        for x in range(width):
            pixel = frame[y, x]
            if (pixel == [255, 255, 255, 0]).all():
                continue
            hex_value = (
                "0x00" + "".join(["{:02x}".format(c) for c in pixel[:3]]).upper()
            )
            print(
                f"\tdraw_pixel_with_color_and_offset_immediate({x}, {y}, {hex_value})"
            )

    print(f".end_macro")


def write_draw_left_mario(frame, frame_number):
    height, width, channels = frame.shape

    # invert the frame horizontally
    frame = np.fliplr(frame)

    print(f".macro draw_left_mario_frame_{frame_number}(%ref_x, %ref_y)")
    # iterate over each pixel in the image, compute hex value of color (ignoring opacity) and print
    for y in range(height):
        for x in range(width):
            pixel = frame[y, x]
            if (pixel == [255, 255, 255, 0]).all():
                continue
            hex_value = (
                "0x00" + "".join(["{:02x}".format(c) for c in pixel[:3]]).upper()
            )
            print(
                f"\tdraw_pixel_with_color_and_offset_immediate({x}, {y}, {hex_value})"
            )

    print(f".end_macro")

    # plt.imshow(frame)
    # plt.show()


def write_clear_mario(height, width, clear_offset):
    print(f".macro clear_mario_frame(%ref_x, %ref_y)")
    # define s2 = color black
    print(f"\tli $s2, BLACK")
    for y in range(-clear_offset, height + clear_offset):
        for x in range(-clear_offset, width + clear_offset):
            # define t9 = x = %ref_x + x_coord
            if x > 0 and y > 0:
                print(f"\tdraw_pixel_with_color_and_offset_immediate({x}, {y}, BLACK)")
                continue

            if x > 0:
                print(f"\taddi $t9, %ref_x, {abs(x)}")
            else:
                print(f"\tsubi $t9, %ref_x, {abs(x)}")
            # define tx = x = %ref_x + x_coord
            if y > 0:
                print(f"\taddi $t8, %ref_y, {abs(y)}")
            else:
                print(f"\tsubi $t8, %ref_y, {abs(y)}")
            print(f"\tdraw_pixel($t9, $t8, $s2)")

    print(f".end_macro")


def process_run_frames(gif, num_frames):

    for i in range(num_frames):
        frame = crop_and_resample(gif, i)
        height, width, channels = frame.shape

        # print("Frame " + str(i) + " dimensions: " + str(height) + "x" + str(width))

        # set all pixels with opacity <245 to white opacity 0
        frame[frame[:, :, 3] < 245] = [255, 255, 255, 0]

        # set bottom left most pixel as reference point
        reference_point = frame[height - 1, 0]

        write_draw_right_mario(frame, frame_number=i)

        write_draw_left_mario(frame, frame_number=i)

        # plt.imshow(frame)
        # plt.show()

    write_clear_mario(height, width, clear_offset=10)


def crop_and_resample_idle(gif, i):
    gif.seek(i)

    # get the frame as numpy array
    frame = gif.convert("RGBA")
    frame = np.array(frame)

    # get the dimensions of the frame
    height, width, channels = frame.shape

    # resample the frame
    frame = Image.fromarray(frame)
    frame = frame.resize((30, 50), Image.LANCZOS)
    frame = np.array(frame)

    return frame


def write_draw_idle_mario(frame, frame_number):
    height, width, channels = frame.shape
    print(f".macro draw_idle_mario_frame_{frame_number}(%ref_x, %ref_y)")
    # iterate over each pixel in the image, compute hex value of color (ignoring opacity) and print
    for y in range(height):
        for x in range(width):
            pixel = frame[y, x]
            if (
                (pixel == [255, 255, 255, 0]).all()
                or (pixel == [0, 0, 0, 255]).all()
                or (pixel == [0, 0, 0, 0]).all()
            ):
                continue
            hex_value = (
                "0x00" + "".join(["{:02x}".format(c) for c in pixel[:3]]).upper()
            )
            print(
                f"\tdraw_pixel_with_color_and_offset_immediate({x}, {y}, {hex_value})"
            )

    print(f".end_macro")


# read in the gif file
gif = Image.open("mario-run.gif")

# get the number of frames
num_frames = gif.n_frames
# print("Number of frames: " + str(num_frames))


process_run_frames(gif, num_frames)


# now read in the idle frame and do the same thing

gif = Image.open("mario-idle.gif")
num_frames = gif.n_frames


for i in range(num_frames):
    frame = crop_and_resample_idle(gif, i)

    write_draw_idle_mario(frame, frame_number=i)

    # plt.imshow(frame)
    # plt.show()
